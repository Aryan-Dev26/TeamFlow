// Enterprise WebSocket Infrastructure for Real-time Features
import { Server as SocketIOServer, Socket } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { RedisManager } from './infrastructure'
import { EnterpriseMonitoring } from './monitoring'
import { ConfigManager } from './config'
import { createAdapter } from '@socket.io/redis-adapter'

// Real-time Event Types
export interface RealtimeEvent {
  type: string
  payload: any
  userId?: string
  roomId?: string
  timestamp: Date
  metadata?: Record<string, any>
}

// User Session Interface
export interface UserSession {
  userId: string
  socketId: string
  rooms: Set<string>
  metadata: Record<string, any>
  connectedAt: Date
  lastActivity: Date
}

// Room Management Interface
export interface Room {
  id: string
  name: string
  type: 'document' | 'board' | 'meeting' | 'general'
  participants: Set<string>
  createdAt: Date
  metadata: Record<string, any>
}

// Connection Statistics
export interface ConnectionStats {
  totalConnections: number
  activeRooms: number
  messagesPerSecond: number
  averageLatency: number
  errorRate: number
}

// Enterprise WebSocket Manager
export class EnterpriseWebSocketManager {
  private io: SocketIOServer
  private redisManager: RedisManager
  private monitoring: EnterpriseMonitoring
  private config: ConfigManager
  private userSessions: Map<string, UserSession> = new Map()
  private rooms: Map<string, Room> = new Map()
  private messageQueue: RealtimeEvent[] = []
  private stats: ConnectionStats = {
    totalConnections: 0,
    activeRooms: 0,
    messagesPerSecond: 0,
    averageLatency: 0,
    errorRate: 0
  }

  constructor(server: HTTPServer) {
    this.redisManager = RedisManager.getInstance()
    this.monitoring = EnterpriseMonitoring.getInstance()
    this.config = ConfigManager.getInstance()

    // Initialize Socket.IO with enterprise configuration
    this.io = new SocketIOServer(server, {
      cors: this.config.get('server').cors,
      pingTimeout: this.config.get('realtime').pingTimeout,
      pingInterval: this.config.get('realtime').pingInterval,
      upgradeTimeout: this.config.get('realtime').upgradeTimeout,
      maxHttpBufferSize: this.config.get('realtime').maxHttpBufferSize,
      transports: this.config.get('realtime').transports,
      compression: this.config.get('realtime').compression
    })

    this.setupRedisAdapter()
    this.setupEventHandlers()
    this.setupMonitoring()
    this.startMessageProcessor()
  }

  private async setupRedisAdapter(): Promise<void> {
    try {
      const pubClient = this.redisManager.getPubClient()
      const subClient = this.redisManager.getSubClient()
      
      this.io.adapter(createAdapter(pubClient, subClient))
      this.monitoring.recordMetric('websocket.redis_adapter.setup', 1, { status: 'success' })
    } catch (error) {
      this.monitoring.recordMetric('websocket.redis_adapter.setup', 1, { status: 'error' })
      console.error('Failed to setup Redis adapter:', error)
    }
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket)
    })

    // Handle server-level events
    this.io.engine.on('connection_error', (error) => {
      this.monitoring.recordMetric('websocket.connection_errors', 1)
      console.error('WebSocket connection error:', error)
    })
  }

  private handleConnection(socket: Socket): void {
    const startTime = performance.now()
    
    try {
      // Extract user information from authentication
      const userId = this.extractUserId(socket)
      if (!userId) {
        socket.disconnect(true)
        return
      }

      // Create user session
      const session: UserSession = {
        userId,
        socketId: socket.id,
        rooms: new Set(),
        metadata: {},
        connectedAt: new Date(),
        lastActivity: new Date()
      }

      this.userSessions.set(socket.id, session)
      this.stats.totalConnections++

      // Record connection metrics
      const connectionTime = performance.now() - startTime
      this.monitoring.recordMetric('websocket.connection.duration', connectionTime)
      this.monitoring.recordMetric('websocket.connections.active', this.stats.totalConnections)

      console.log(`User ${userId} connected with socket ${socket.id}`)

      // Setup socket event handlers
      this.setupSocketHandlers(socket, session)

      // Send welcome message
      socket.emit('connected', {
        sessionId: socket.id,
        userId,
        serverTime: new Date().toISOString(),
        features: this.getEnabledFeatures()
      })

    } catch (error) {
      this.monitoring.recordMetric('websocket.connection.errors', 1)
      console.error('Error handling connection:', error)
      socket.disconnect(true)
    }
  }

  private setupSocketHandlers(socket: Socket, session: UserSession): void {
    // Join room handler
    socket.on('join_room', async (data: { roomId: string; roomType?: string }) => {
      try {
        await this.handleJoinRoom(socket, session, data.roomId, data.roomType)
      } catch (error) {
        socket.emit('error', { type: 'join_room_failed', message: error.message })
      }
    })

    // Leave room handler
    socket.on('leave_room', async (data: { roomId: string }) => {
      try {
        await this.handleLeaveRoom(socket, session, data.roomId)
      } catch (error) {
        socket.emit('error', { type: 'leave_room_failed', message: error.message })
      }
    })

    // Real-time message handler
    socket.on('realtime_event', async (event: RealtimeEvent) => {
      try {
        await this.handleRealtimeEvent(socket, session, event)
      } catch (error) {
        socket.emit('error', { type: 'event_failed', message: error.message })
      }
    })

    // Typing indicator handler
    socket.on('typing', (data: { roomId: string; isTyping: boolean }) => {
      this.handleTypingIndicator(socket, session, data.roomId, data.isTyping)
    })

    // Cursor position handler
    socket.on('cursor_move', (data: { roomId: string; x: number; y: number }) => {
      this.handleCursorMove(socket, session, data.roomId, data.x, data.y)
    })

    // Presence update handler
    socket.on('presence_update', (data: { status: string; metadata?: any }) => {
      this.handlePresenceUpdate(socket, session, data.status, data.metadata)
    })

    // Ping/Pong for latency measurement
    socket.on('ping', (timestamp: number) => {
      const latency = Date.now() - timestamp
      this.monitoring.recordMetric('websocket.latency', latency, { userId: session.userId })
      socket.emit('pong', { timestamp, latency })
    })

    // Disconnect handler
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnection(socket, session, reason)
    })

    // Error handler
    socket.on('error', (error: Error) => {
      this.monitoring.recordMetric('websocket.socket_errors', 1, { userId: session.userId })
      console.error(`Socket error for user ${session.userId}:`, error)
    })

    // Activity tracking
    const activityEvents = ['realtime_event', 'typing', 'cursor_move', 'presence_update']
    activityEvents.forEach(event => {
      socket.on(event, () => {
        session.lastActivity = new Date()
      })
    })
  }

  private async handleJoinRoom(socket: Socket, session: UserSession, roomId: string, roomType?: string): Promise<void> {
    // Validate room access (implement your authorization logic here)
    if (!this.canUserAccessRoom(session.userId, roomId)) {
      throw new Error('Access denied to room')
    }

    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        name: roomId,
        type: (roomType as any) || 'general',
        participants: new Set(),
        createdAt: new Date(),
        metadata: {}
      })
      this.stats.activeRooms++
    }

    const room = this.rooms.get(roomId)!
    
    // Join socket to room
    await socket.join(roomId)
    session.rooms.add(roomId)
    room.participants.add(session.userId)

    // Notify other participants
    socket.to(roomId).emit('user_joined', {
      userId: session.userId,
      roomId,
      timestamp: new Date().toISOString(),
      participantCount: room.participants.size
    })

    // Send room state to new participant
    socket.emit('room_joined', {
      roomId,
      roomType: room.type,
      participants: Array.from(room.participants),
      metadata: room.metadata
    })

    this.monitoring.recordMetric('websocket.room.joins', 1, { roomType: room.type })
    console.log(`User ${session.userId} joined room ${roomId}`)
  }

  private async handleLeaveRoom(socket: Socket, session: UserSession, roomId: string): Promise<void> {
    const room = this.rooms.get(roomId)
    if (!room) return

    // Leave socket room
    await socket.leave(roomId)
    session.rooms.delete(roomId)
    room.participants.delete(session.userId)

    // Notify other participants
    socket.to(roomId).emit('user_left', {
      userId: session.userId,
      roomId,
      timestamp: new Date().toISOString(),
      participantCount: room.participants.size
    })

    // Clean up empty rooms
    if (room.participants.size === 0) {
      this.rooms.delete(roomId)
      this.stats.activeRooms--
    }

    this.monitoring.recordMetric('websocket.room.leaves', 1, { roomType: room.type })
    console.log(`User ${session.userId} left room ${roomId}`)
  }

  private async handleRealtimeEvent(socket: Socket, session: UserSession, event: RealtimeEvent): Promise<void> {
    // Add metadata to event
    const enrichedEvent: RealtimeEvent = {
      ...event,
      userId: session.userId,
      timestamp: new Date(),
      metadata: {
        ...event.metadata,
        socketId: socket.id,
        source: 'websocket'
      }
    }

    // Validate event
    if (!this.validateEvent(enrichedEvent)) {
      throw new Error('Invalid event format')
    }

    // Add to message queue for processing
    this.messageQueue.push(enrichedEvent)

    // Broadcast to room if specified
    if (event.roomId && session.rooms.has(event.roomId)) {
      socket.to(event.roomId).emit('realtime_event', enrichedEvent)
    }

    // Store event for persistence (implement based on your needs)
    await this.persistEvent(enrichedEvent)

    this.monitoring.recordMetric('websocket.events.processed', 1, { 
      type: event.type,
      roomId: event.roomId || 'none'
    })
  }

  private handleTypingIndicator(socket: Socket, session: UserSession, roomId: string, isTyping: boolean): void {
    if (!session.rooms.has(roomId)) return

    socket.to(roomId).emit('typing_indicator', {
      userId: session.userId,
      roomId,
      isTyping,
      timestamp: new Date().toISOString()
    })

    this.monitoring.recordMetric('websocket.typing_indicators', 1)
  }

  private handleCursorMove(socket: Socket, session: UserSession, roomId: string, x: number, y: number): void {
    if (!session.rooms.has(roomId)) return

    socket.to(roomId).emit('cursor_move', {
      userId: session.userId,
      roomId,
      position: { x, y },
      timestamp: new Date().toISOString()
    })

    this.monitoring.recordMetric('websocket.cursor_moves', 1)
  }

  private handlePresenceUpdate(socket: Socket, session: UserSession, status: string, metadata?: any): void {
    session.metadata = { ...session.metadata, status, ...metadata }

    // Broadcast presence to all rooms user is in
    session.rooms.forEach(roomId => {
      socket.to(roomId).emit('presence_update', {
        userId: session.userId,
        status,
        metadata,
        timestamp: new Date().toISOString()
      })
    })

    this.monitoring.recordMetric('websocket.presence_updates', 1)
  }

  private handleDisconnection(socket: Socket, session: UserSession, reason: string): void {
    // Clean up user session
    this.userSessions.delete(socket.id)
    this.stats.totalConnections--

    // Remove user from all rooms
    session.rooms.forEach(roomId => {
      const room = this.rooms.get(roomId)
      if (room) {
        room.participants.delete(session.userId)
        
        // Notify other participants
        socket.to(roomId).emit('user_left', {
          userId: session.userId,
          roomId,
          reason,
          timestamp: new Date().toISOString(),
          participantCount: room.participants.size
        })

        // Clean up empty rooms
        if (room.participants.size === 0) {
          this.rooms.delete(roomId)
          this.stats.activeRooms--
        }
      }
    })

    this.monitoring.recordMetric('websocket.disconnections', 1, { reason })
    this.monitoring.recordMetric('websocket.connections.active', this.stats.totalConnections)

    console.log(`User ${session.userId} disconnected: ${reason}`)
  }

  private setupMonitoring(): void {
    // Monitor connection statistics every 30 seconds
    setInterval(() => {
      this.updateConnectionStats()
      this.monitoring.recordMetric('websocket.rooms.active', this.stats.activeRooms)
      this.monitoring.recordMetric('websocket.connections.total', this.stats.totalConnections)
      this.monitoring.recordMetric('websocket.messages_per_second', this.stats.messagesPerSecond)
    }, 30000)

    // Clean up inactive sessions every 5 minutes
    setInterval(() => {
      this.cleanupInactiveSessions()
    }, 5 * 60 * 1000)
  }

  private updateConnectionStats(): void {
    const now = Date.now()
    const recentMessages = this.messageQueue.filter(
      event => now - event.timestamp.getTime() < 60000 // Last minute
    )
    
    this.stats.messagesPerSecond = recentMessages.length / 60
    
    // Calculate average latency from recent ping measurements
    // This would be implemented based on your specific latency tracking
  }

  private cleanupInactiveSessions(): void {
    const inactivityThreshold = 30 * 60 * 1000 // 30 minutes
    const now = Date.now()

    for (const [socketId, session] of this.userSessions) {
      if (now - session.lastActivity.getTime() > inactivityThreshold) {
        const socket = this.io.sockets.sockets.get(socketId)
        if (socket) {
          socket.disconnect(true)
        }
      }
    }
  }

  private startMessageProcessor(): void {
    // Process message queue every 100ms
    setInterval(() => {
      if (this.messageQueue.length > 0) {
        const batch = this.messageQueue.splice(0, 100) // Process in batches
        this.processBatch(batch)
      }
    }, 100)
  }

  private async processBatch(events: RealtimeEvent[]): Promise<void> {
    try {
      // Implement batch processing logic here
      // This could include analytics, persistence, external integrations, etc.
      
      for (const event of events) {
        // Example: Store in analytics
        this.monitoring.recordMetric(`event.${event.type}`, 1, {
          userId: event.userId || 'anonymous',
          roomId: event.roomId || 'none'
        })
      }
    } catch (error) {
      console.error('Error processing event batch:', error)
      this.monitoring.recordMetric('websocket.batch_processing.errors', 1)
    }
  }

  // Utility methods
  private extractUserId(socket: Socket): string | null {
    // Extract user ID from authentication token
    // This would integrate with your authentication system
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization
    
    if (!token) return null
    
    try {
      // Implement JWT verification or session validation
      // For now, return a mock user ID
      return `user_${socket.id.substring(0, 8)}`
    } catch (error) {
      return null
    }
  }

  private canUserAccessRoom(userId: string, roomId: string): boolean {
    // Implement your authorization logic here
    // This could check database permissions, role-based access, etc.
    return true // For now, allow all access
  }

  private validateEvent(event: RealtimeEvent): boolean {
    return !!(event.type && event.payload && event.timestamp)
  }

  private async persistEvent(event: RealtimeEvent): Promise<void> {
    // Implement event persistence logic
    // This could store to database, message queue, etc.
    
    try {
      const redis = this.redisManager.getClient()
      await redis.lpush('realtime_events', JSON.stringify(event))
      await redis.ltrim('realtime_events', 0, 10000) // Keep last 10k events
    } catch (error) {
      console.error('Error persisting event:', error)
    }
  }

  private getEnabledFeatures(): string[] {
    const features = []
    
    if (this.config.isFeatureEnabled('realtime')) features.push('realtime')
    if (this.config.isFeatureEnabled('ai')) features.push('ai')
    
    return features
  }

  // Public API methods
  public broadcastToRoom(roomId: string, event: string, data: any): void {
    this.io.to(roomId).emit(event, data)
    this.monitoring.recordMetric('websocket.broadcasts', 1, { roomId })
  }

  public broadcastToUser(userId: string, event: string, data: any): void {
    // Find user's socket
    for (const session of this.userSessions.values()) {
      if (session.userId === userId) {
        this.io.to(session.socketId).emit(event, data)
        break
      }
    }
    this.monitoring.recordMetric('websocket.user_messages', 1, { userId })
  }

  public getRoomParticipants(roomId: string): string[] {
    const room = this.rooms.get(roomId)
    return room ? Array.from(room.participants) : []
  }

  public getUserRooms(userId: string): string[] {
    for (const session of this.userSessions.values()) {
      if (session.userId === userId) {
        return Array.from(session.rooms)
      }
    }
    return []
  }

  public getConnectionStats(): ConnectionStats {
    return { ...this.stats }
  }

  public getActiveUsers(): string[] {
    return Array.from(new Set(
      Array.from(this.userSessions.values()).map(session => session.userId)
    ))
  }

  public async shutdown(): Promise<void> {
    console.log('Shutting down WebSocket server...')
    
    // Notify all clients
    this.io.emit('server_shutdown', {
      message: 'Server is shutting down',
      timestamp: new Date().toISOString()
    })

    // Close all connections
    this.io.close()
    
    console.log('WebSocket server shutdown complete')
  }
}

// Connection Recovery Manager
export class ConnectionRecoveryManager {
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second

  handleReconnection(socket: Socket, userId: string): boolean {
    const attempts = this.reconnectAttempts.get(userId) || 0
    
    if (attempts >= this.maxReconnectAttempts) {
      return false
    }

    this.reconnectAttempts.set(userId, attempts + 1)
    
    // Exponential backoff
    const delay = this.reconnectDelay * Math.pow(2, attempts)
    
    setTimeout(() => {
      // Implement reconnection logic
      console.log(`Attempting reconnection for user ${userId}, attempt ${attempts + 1}`)
    }, delay)

    return true
  }

  resetReconnectAttempts(userId: string): void {
    this.reconnectAttempts.delete(userId)
  }
}

// Rate Limiting for WebSocket events
export class WebSocketRateLimiter {
  private userLimits: Map<string, { count: number; resetTime: number }> = new Map()
  private maxEventsPerMinute = 100

  isAllowed(userId: string): boolean {
    const now = Date.now()
    const userLimit = this.userLimits.get(userId)

    if (!userLimit || now > userLimit.resetTime) {
      this.userLimits.set(userId, {
        count: 1,
        resetTime: now + 60000 // Reset after 1 minute
      })
      return true
    }

    if (userLimit.count >= this.maxEventsPerMinute) {
      return false
    }

    userLimit.count++
    return true
  }
}

export { SocketIOServer, Socket }