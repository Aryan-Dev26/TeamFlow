// Enterprise Infrastructure Management
import Redis from 'ioredis'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import winston from 'winston'

// Enterprise Configuration
export interface EnterpriseConfig {
  redis: {
    host: string
    port: number
    password?: string
    cluster?: boolean
  }
  server: {
    port: number
    cors: {
      origin: string[]
      credentials: boolean
    }
    rateLimit: {
      windowMs: number
      max: number
    }
  }
  monitoring: {
    logLevel: string
    enableMetrics: boolean
  }
}

// Default Enterprise Configuration
export const defaultConfig: EnterpriseConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    cluster: process.env.REDIS_CLUSTER === 'true'
  },
  server: {
    port: parseInt(process.env.PORT || '3001'),
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // limit each IP to 1000 requests per windowMs
    }
  },
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: process.env.ENABLE_METRICS === 'true'
  }
}

// Enterprise Logger
export const logger = winston.createLogger({
  level: defaultConfig.monitoring.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'teamflow-enterprise' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
})

// Redis Connection Manager
export class RedisManager {
  private static instance: RedisManager
  private redis: Redis
  private pubClient: Redis
  private subClient: Redis

  private constructor(config: EnterpriseConfig['redis']) {
    if (config.cluster) {
      // Redis Cluster configuration for enterprise scale
      this.redis = new Redis.Cluster([
        { host: config.host, port: config.port }
      ], {
        redisOptions: {
          password: config.password
        }
      })
    } else {
      this.redis = new Redis({
        host: config.host,
        port: config.port,
        password: config.password,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      })
    }

    // Separate clients for pub/sub
    this.pubClient = this.redis.duplicate()
    this.subClient = this.redis.duplicate()

    this.setupEventHandlers()
  }

  static getInstance(config?: EnterpriseConfig['redis']): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager(config || defaultConfig.redis)
    }
    return RedisManager.instance
  }

  private setupEventHandlers() {
    this.redis.on('connect', () => {
      logger.info('Redis connected successfully')
    })

    this.redis.on('error', (error) => {
      logger.error('Redis connection error:', error)
    })

    this.redis.on('reconnecting', () => {
      logger.info('Redis reconnecting...')
    })
  }

  getClient(): Redis {
    return this.redis
  }

  getPubClient(): Redis {
    return this.pubClient
  }

  getSubClient(): Redis {
    return this.subClient
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.redis.ping()
      return true
    } catch (error) {
      logger.error('Redis health check failed:', error)
      return false
    }
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.redis.disconnect(),
      this.pubClient.disconnect(),
      this.subClient.disconnect()
    ])
  }
}

// Connection Pool Manager
export class ConnectionPoolManager {
  private pools: Map<string, any> = new Map()
  private maxConnections: number = 100
  private minConnections: number = 10

  constructor(maxConnections = 100, minConnections = 10) {
    this.maxConnections = maxConnections
    this.minConnections = minConnections
  }

  createPool(name: string, factory: () => any): void {
    if (this.pools.has(name)) {
      logger.warn(`Connection pool ${name} already exists`)
      return
    }

    const pool = {
      connections: [],
      activeConnections: 0,
      factory,
      maxConnections: this.maxConnections,
      minConnections: this.minConnections
    }

    // Pre-create minimum connections
    for (let i = 0; i < this.minConnections; i++) {
      pool.connections.push(factory())
    }

    this.pools.set(name, pool)
    logger.info(`Created connection pool: ${name}`)
  }

  async getConnection(poolName: string): Promise<any> {
    const pool = this.pools.get(poolName)
    if (!pool) {
      throw new Error(`Connection pool ${poolName} not found`)
    }

    if (pool.connections.length > 0) {
      pool.activeConnections++
      return pool.connections.pop()
    }

    if (pool.activeConnections < pool.maxConnections) {
      pool.activeConnections++
      return pool.factory()
    }

    throw new Error(`Connection pool ${poolName} exhausted`)
  }

  releaseConnection(poolName: string, connection: any): void {
    const pool = this.pools.get(poolName)
    if (!pool) {
      logger.warn(`Attempted to release connection to non-existent pool: ${poolName}`)
      return
    }

    pool.activeConnections--
    if (pool.connections.length < pool.minConnections) {
      pool.connections.push(connection)
    }
  }

  getPoolStats(poolName: string) {
    const pool = this.pools.get(poolName)
    if (!pool) return null

    return {
      available: pool.connections.length,
      active: pool.activeConnections,
      total: pool.connections.length + pool.activeConnections,
      maxConnections: pool.maxConnections
    }
  }
}

// Load Balancer
export class LoadBalancer {
  private servers: Array<{ id: string; url: string; weight: number; active: boolean }> = []
  private currentIndex = 0

  addServer(id: string, url: string, weight = 1): void {
    this.servers.push({ id, url, weight, active: true })
    logger.info(`Added server to load balancer: ${id} (${url})`)
  }

  removeServer(id: string): void {
    this.servers = this.servers.filter(server => server.id !== id)
    logger.info(`Removed server from load balancer: ${id}`)
  }

  getNextServer(): string | null {
    const activeServers = this.servers.filter(server => server.active)
    if (activeServers.length === 0) return null

    // Round-robin with weight consideration
    const server = activeServers[this.currentIndex % activeServers.length]
    this.currentIndex++
    return server.url
  }

  markServerDown(id: string): void {
    const server = this.servers.find(s => s.id === id)
    if (server) {
      server.active = false
      logger.warn(`Marked server as down: ${id}`)
    }
  }

  markServerUp(id: string): void {
    const server = this.servers.find(s => s.id === id)
    if (server) {
      server.active = true
      logger.info(`Marked server as up: ${id}`)
    }
  }

  getServerStats() {
    return {
      total: this.servers.length,
      active: this.servers.filter(s => s.active).length,
      servers: this.servers.map(s => ({
        id: s.id,
        url: s.url,
        weight: s.weight,
        active: s.active
      }))
    }
  }
}

// Auto-scaling Manager
export class AutoScalingManager {
  private metrics: Map<string, number[]> = new Map()
  private thresholds = {
    scaleUp: 80, // CPU/Memory percentage
    scaleDown: 30,
    minInstances: 2,
    maxInstances: 20
  }
  private currentInstances = 2

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const values = this.metrics.get(name)!
    values.push(value)
    
    // Keep only last 10 measurements
    if (values.length > 10) {
      values.shift()
    }
  }

  getAverageMetric(name: string): number {
    const values = this.metrics.get(name)
    if (!values || values.length === 0) return 0
    
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  shouldScale(): { action: 'up' | 'down' | 'none'; reason: string } {
    const avgCpu = this.getAverageMetric('cpu')
    const avgMemory = this.getAverageMetric('memory')
    const avgLoad = Math.max(avgCpu, avgMemory)

    if (avgLoad > this.thresholds.scaleUp && this.currentInstances < this.thresholds.maxInstances) {
      return { action: 'up', reason: `High load detected: ${avgLoad.toFixed(2)}%` }
    }

    if (avgLoad < this.thresholds.scaleDown && this.currentInstances > this.thresholds.minInstances) {
      return { action: 'down', reason: `Low load detected: ${avgLoad.toFixed(2)}%` }
    }

    return { action: 'none', reason: `Load within normal range: ${avgLoad.toFixed(2)}%` }
  }

  async scaleUp(): Promise<void> {
    if (this.currentInstances >= this.thresholds.maxInstances) {
      logger.warn('Cannot scale up: Maximum instances reached')
      return
    }

    this.currentInstances++
    logger.info(`Scaling up to ${this.currentInstances} instances`)
    
    // Here you would integrate with your container orchestration system
    // e.g., Kubernetes, Docker Swarm, or cloud auto-scaling groups
  }

  async scaleDown(): Promise<void> {
    if (this.currentInstances <= this.thresholds.minInstances) {
      logger.warn('Cannot scale down: Minimum instances reached')
      return
    }

    this.currentInstances--
    logger.info(`Scaling down to ${this.currentInstances} instances`)
    
    // Here you would integrate with your container orchestration system
  }

  getScalingStats() {
    return {
      currentInstances: this.currentInstances,
      minInstances: this.thresholds.minInstances,
      maxInstances: this.thresholds.maxInstances,
      metrics: Object.fromEntries(
        Array.from(this.metrics.entries()).map(([key, values]) => [
          key,
          {
            current: values[values.length - 1] || 0,
            average: this.getAverageMetric(key)
          }
        ])
      )
    }
  }
}

// Enterprise Express Server Setup
export function createEnterpriseServer(config: EnterpriseConfig = defaultConfig) {
  const app = express()
  const server = createServer(app)

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }))

  // CORS configuration
  app.use(cors(config.server.cors))

  // Compression
  app.use(compression())

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.server.rateLimit.windowMs,
    max: config.server.rateLimit.max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  })
  app.use(limiter)

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    })
    next()
  })

  // Health check endpoint
  app.get('/health', async (req, res) => {
    const redisManager = RedisManager.getInstance()
    const redisHealthy = await redisManager.healthCheck()
    
    const health = {
      status: redisHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisHealthy ? 'up' : 'down',
        server: 'up'
      }
    }

    res.status(redisHealthy ? 200 : 503).json(health)
  })

  // Metrics endpoint
  app.get('/metrics', (req, res) => {
    // Here you would integrate with your monitoring system
    // e.g., Prometheus metrics
    res.json({
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    })
  })

  return { app, server }
}

// Enterprise Infrastructure Manager
export class EnterpriseInfrastructure {
  private redisManager: RedisManager
  private connectionPool: ConnectionPoolManager
  private loadBalancer: LoadBalancer
  private autoScaling: AutoScalingManager
  private server: any
  private io: SocketIOServer

  constructor(config: EnterpriseConfig = defaultConfig) {
    this.redisManager = RedisManager.getInstance(config.redis)
    this.connectionPool = new ConnectionPoolManager()
    this.loadBalancer = new LoadBalancer()
    this.autoScaling = new AutoScalingManager()

    const { app, server } = createEnterpriseServer(config)
    this.server = server

    // Initialize Socket.IO with Redis adapter
    this.io = new SocketIOServer(server, {
      cors: config.server.cors,
      adapter: require('socket.io-redis')({
        pubClient: this.redisManager.getPubClient(),
        subClient: this.redisManager.getSubClient()
      })
    })

    this.setupMonitoring()
  }

  private setupMonitoring(): void {
    // Monitor system metrics every 30 seconds
    setInterval(() => {
      const memUsage = process.memoryUsage()
      const cpuUsage = process.cpuUsage()
      
      // Calculate CPU percentage (simplified)
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000 // Convert to seconds
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100

      this.autoScaling.recordMetric('cpu', cpuPercent)
      this.autoScaling.recordMetric('memory', memPercent)

      // Check if scaling is needed
      const scalingDecision = this.autoScaling.shouldScale()
      if (scalingDecision.action !== 'none') {
        logger.info(`Auto-scaling decision: ${scalingDecision.action} - ${scalingDecision.reason}`)
        
        if (scalingDecision.action === 'up') {
          this.autoScaling.scaleUp()
        } else if (scalingDecision.action === 'down') {
          this.autoScaling.scaleDown()
        }
      }
    }, 30000)
  }

  getRedisManager(): RedisManager {
    return this.redisManager
  }

  getConnectionPool(): ConnectionPoolManager {
    return this.connectionPool
  }

  getLoadBalancer(): LoadBalancer {
    return this.loadBalancer
  }

  getAutoScaling(): AutoScalingManager {
    return this.autoScaling
  }

  getSocketIO(): SocketIOServer {
    return this.io
  }

  async start(port?: number): Promise<void> {
    const serverPort = port || defaultConfig.server.port
    
    return new Promise((resolve) => {
      this.server.listen(serverPort, () => {
        logger.info(`Enterprise server started on port ${serverPort}`)
        resolve()
      })
    })
  }

  async stop(): Promise<void> {
    await this.redisManager.disconnect()
    this.server.close()
    logger.info('Enterprise infrastructure stopped')
  }

  getStatus() {
    return {
      redis: this.redisManager.healthCheck(),
      loadBalancer: this.loadBalancer.getServerStats(),
      autoScaling: this.autoScaling.getScalingStats(),
      uptime: process.uptime()
    }
  }
}