// Enterprise Monitoring and Logging System
import winston from 'winston'
import { performance } from 'perf_hooks'

// Performance Metrics Interface
export interface PerformanceMetric {
  name: string
  value: number
  timestamp: Date
  tags?: Record<string, string>
}

// System Health Interface
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: Record<string, ServiceHealth>
  metrics: Record<string, number>
  timestamp: Date
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded'
  responseTime?: number
  errorRate?: number
  lastCheck: Date
}

// Enterprise Monitoring Manager
export class EnterpriseMonitoring {
  private static instance: EnterpriseMonitoring
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private healthChecks: Map<string, () => Promise<ServiceHealth>> = new Map()
  private alerts: Array<{ level: 'info' | 'warn' | 'error'; message: string; timestamp: Date }> = []
  private logger: winston.Logger

  private constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'teamflow-monitoring' },
      transports: [
        new winston.transports.File({ filename: 'logs/monitoring.log' }),
        new winston.transports.Console({
          format: winston.format.simple()
        })
      ]
    })

    this.startPeriodicHealthChecks()
  }

  static getInstance(): EnterpriseMonitoring {
    if (!EnterpriseMonitoring.instance) {
      EnterpriseMonitoring.instance = new EnterpriseMonitoring()
    }
    return EnterpriseMonitoring.instance
  }

  // Record performance metrics
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      tags
    }

    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }

    const metrics = this.metrics.get(name)!
    metrics.push(metric)

    // Keep only last 1000 metrics per type
    if (metrics.length > 1000) {
      metrics.shift()
    }

    // Check for alerts
    this.checkMetricAlerts(name, value)
  }

  // Time a function execution
  async timeFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric(`${name}.duration`, duration, { status: 'success' })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(`${name}.duration`, duration, { status: 'error' })
      this.recordMetric(`${name}.errors`, 1)
      throw error
    }
  }

  // Register health check for a service
  registerHealthCheck(serviceName: string, checkFn: () => Promise<ServiceHealth>): void {
    this.healthChecks.set(serviceName, checkFn)
    this.logger.info(`Registered health check for service: ${serviceName}`)
  }

  // Get current system health
  async getSystemHealth(): Promise<SystemHealth> {
    const services: Record<string, ServiceHealth> = {}
    
    for (const [serviceName, checkFn] of this.healthChecks) {
      try {
        services[serviceName] = await checkFn()
      } catch (error) {
        services[serviceName] = {
          status: 'down',
          lastCheck: new Date()
        }
        this.logger.error(`Health check failed for ${serviceName}:`, error)
      }
    }

    // Calculate overall system status
    const serviceStatuses = Object.values(services).map(s => s.status)
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
    
    if (serviceStatuses.includes('down')) {
      overallStatus = 'unhealthy'
    } else if (serviceStatuses.includes('degraded')) {
      overallStatus = 'degraded'
    }

    // Get current metrics
    const currentMetrics: Record<string, number> = {}
    for (const [name, metrics] of this.metrics) {
      if (metrics.length > 0) {
        currentMetrics[name] = metrics[metrics.length - 1].value
      }
    }

    return {
      status: overallStatus,
      services,
      metrics: currentMetrics,
      timestamp: new Date()
    }
  }

  // Get metrics for a specific time range
  getMetrics(name: string, since?: Date): PerformanceMetric[] {
    const metrics = this.metrics.get(name) || []
    if (!since) return metrics

    return metrics.filter(m => m.timestamp >= since)
  }

  // Get aggregated metrics
  getAggregatedMetrics(name: string, since?: Date): {
    count: number
    avg: number
    min: number
    max: number
    sum: number
  } {
    const metrics = this.getMetrics(name, since)
    if (metrics.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, sum: 0 }
    }

    const values = metrics.map(m => m.value)
    const sum = values.reduce((a, b) => a + b, 0)
    
    return {
      count: values.length,
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      sum
    }
  }

  // Alert system
  private checkMetricAlerts(name: string, value: number): void {
    const alertRules = [
      { metric: 'response_time', threshold: 1000, level: 'warn' as const },
      { metric: 'response_time', threshold: 5000, level: 'error' as const },
      { metric: 'error_rate', threshold: 0.05, level: 'warn' as const },
      { metric: 'error_rate', threshold: 0.1, level: 'error' as const },
      { metric: 'cpu_usage', threshold: 80, level: 'warn' as const },
      { metric: 'cpu_usage', threshold: 95, level: 'error' as const },
      { metric: 'memory_usage', threshold: 80, level: 'warn' as const },
      { metric: 'memory_usage', threshold: 95, level: 'error' as const }
    ]

    for (const rule of alertRules) {
      if (name.includes(rule.metric) && value > rule.threshold) {
        this.createAlert(rule.level, `${name} exceeded threshold: ${value} > ${rule.threshold}`)
      }
    }
  }

  private createAlert(level: 'info' | 'warn' | 'error', message: string): void {
    const alert = {
      level,
      message,
      timestamp: new Date()
    }

    this.alerts.push(alert)
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts.shift()
    }

    this.logger[level](`ALERT: ${message}`)
  }

  // Get recent alerts
  getAlerts(level?: 'info' | 'warn' | 'error', limit = 50): typeof this.alerts {
    let alerts = this.alerts
    
    if (level) {
      alerts = alerts.filter(a => a.level === level)
    }

    return alerts.slice(-limit)
  }

  // Start periodic health checks
  private startPeriodicHealthChecks(): void {
    setInterval(async () => {
      try {
        const health = await this.getSystemHealth()
        this.recordMetric('system.health_check', health.status === 'healthy' ? 1 : 0)
        
        // Record service-specific metrics
        for (const [serviceName, serviceHealth] of Object.entries(health.services)) {
          this.recordMetric(`service.${serviceName}.status`, serviceHealth.status === 'up' ? 1 : 0)
          if (serviceHealth.responseTime) {
            this.recordMetric(`service.${serviceName}.response_time`, serviceHealth.responseTime)
          }
          if (serviceHealth.errorRate) {
            this.recordMetric(`service.${serviceName}.error_rate`, serviceHealth.errorRate)
          }
        }
      } catch (error) {
        this.logger.error('Periodic health check failed:', error)
      }
    }, 30000) // Every 30 seconds
  }

  // Export metrics in Prometheus format
  exportPrometheusMetrics(): string {
    let output = ''
    
    for (const [name, metrics] of this.metrics) {
      if (metrics.length === 0) continue
      
      const latest = metrics[metrics.length - 1]
      const metricName = name.replace(/[^a-zA-Z0-9_]/g, '_')
      
      output += `# HELP ${metricName} ${name} metric\n`
      output += `# TYPE ${metricName} gauge\n`
      
      if (latest.tags) {
        const tags = Object.entries(latest.tags)
          .map(([key, value]) => `${key}="${value}"`)
          .join(',')
        output += `${metricName}{${tags}} ${latest.value}\n`
      } else {
        output += `${metricName} ${latest.value}\n`
      }
    }
    
    return output
  }
}

// Performance Profiler
export class PerformanceProfiler {
  private static instance: PerformanceProfiler
  private profiles: Map<string, { start: number; samples: number[] }> = new Map()
  private monitoring: EnterpriseMonitoring

  private constructor() {
    this.monitoring = EnterpriseMonitoring.getInstance()
  }

  static getInstance(): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler()
    }
    return PerformanceProfiler.instance
  }

  // Start profiling a section
  start(name: string): void {
    this.profiles.set(name, {
      start: performance.now(),
      samples: []
    })
  }

  // End profiling and record metric
  end(name: string): number {
    const profile = this.profiles.get(name)
    if (!profile) {
      throw new Error(`No profile started for: ${name}`)
    }

    const duration = performance.now() - profile.start
    profile.samples.push(duration)
    
    // Keep only last 100 samples
    if (profile.samples.length > 100) {
      profile.samples.shift()
    }

    this.monitoring.recordMetric(`profile.${name}`, duration)
    return duration
  }

  // Get profile statistics
  getStats(name: string): {
    count: number
    avg: number
    min: number
    max: number
    p95: number
    p99: number
  } | null {
    const profile = this.profiles.get(name)
    if (!profile || profile.samples.length === 0) {
      return null
    }

    const samples = [...profile.samples].sort((a, b) => a - b)
    const count = samples.length
    const sum = samples.reduce((a, b) => a + b, 0)
    
    return {
      count,
      avg: sum / count,
      min: samples[0],
      max: samples[count - 1],
      p95: samples[Math.floor(count * 0.95)],
      p99: samples[Math.floor(count * 0.99)]
    }
  }

  // Profile a function
  async profile<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name)
    try {
      const result = await fn()
      this.end(name)
      return result
    } catch (error) {
      this.end(name)
      throw error
    }
  }
}

// Request/Response Middleware for monitoring
export function createMonitoringMiddleware() {
  const monitoring = EnterpriseMonitoring.getInstance()
  
  return (req: any, res: any, next: any) => {
    const start = performance.now()
    const originalSend = res.send

    res.send = function(data: any) {
      const duration = performance.now() - start
      const statusCode = res.statusCode
      
      // Record metrics
      monitoring.recordMetric('http.request.duration', duration, {
        method: req.method,
        route: req.route?.path || req.path,
        status: statusCode.toString()
      })
      
      monitoring.recordMetric('http.request.count', 1, {
        method: req.method,
        status: statusCode.toString()
      })

      if (statusCode >= 400) {
        monitoring.recordMetric('http.request.errors', 1, {
          method: req.method,
          status: statusCode.toString()
        })
      }

      return originalSend.call(this, data)
    }

    next()
  }
}

// Default health checks
export const defaultHealthChecks = {
  database: async (): Promise<ServiceHealth> => {
    try {
      // This would be replaced with actual database health check
      const start = performance.now()
      // await prisma.$queryRaw`SELECT 1`
      const responseTime = performance.now() - start
      
      return {
        status: 'up',
        responseTime,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date()
      }
    }
  },

  redis: async (): Promise<ServiceHealth> => {
    try {
      const start = performance.now()
      // Redis health check would go here
      const responseTime = performance.now() - start
      
      return {
        status: 'up',
        responseTime,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date()
      }
    }
  },

  external_api: async (): Promise<ServiceHealth> => {
    try {
      const start = performance.now()
      // External API health check
      const responseTime = performance.now() - start
      
      return {
        status: 'up',
        responseTime,
        lastCheck: new Date()
      }
    } catch (error) {
      return {
        status: 'down',
        lastCheck: new Date()
      }
    }
  }
}

// Initialize monitoring with default health checks
export function initializeMonitoring(): EnterpriseMonitoring {
  const monitoring = EnterpriseMonitoring.getInstance()
  
  // Register default health checks
  Object.entries(defaultHealthChecks).forEach(([name, checkFn]) => {
    monitoring.registerHealthCheck(name, checkFn)
  })
  
  return monitoring
}