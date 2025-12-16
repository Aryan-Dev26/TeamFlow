// Real-Time Collaboration Engine with Operational Transform
import { EnterpriseWebSocketManager } from './websocket'
import { EnterpriseMonitoring } from './monitoring'
import { RedisManager } from './infrastructure'

// Operational Transform Types
export interface Operation {
  id: string
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  userId: string
  timestamp: Date
  version: number
}

export interface DocumentState {
  id: string
  content: string
  version: number
  operations: Operation[]
  participants: Set<string>
  lastModified: Date
  metadata: Record<string, any>
}

export interface CursorPosition {
  userId: string
  position: number
  selection?: { start: number; end: number }
  color: string
  timestamp: Date
}

export interface TypingIndicator {
  userId: string
  isTyping: boolean
  position: number
  timestamp: Date
}

// Operational Transform Engine
export class OperationalTransform {
  // Transform operation against another operation
  static transform(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.type === 'insert' && op2.type === 'insert') {
      return this.transformInsertInsert(op1, op2)
    } else if (op1.type === 'insert' && op2.type === 'delete') {
      return this.transformInsertDelete(op1, op2)
    } else if (op1.type === 'delete' && op2.type === 'insert') {
      const [transformed2, transformed1] = this.transformInsertDelete(op2, op1)
      return [transformed1, transformed2]
    } else if (op1.type === 'delete' && op2.type === 'delete') {
      return this.transformDeleteDelete(op1, op2)
    } else if (op1.type === 'retain' || op2.type === 'retain') {
      return this.transformWithRetain(op1, op2)
    }
    
    return [op1, op2] // No transformation needed
  }

  private static transformInsertInsert(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.position <= op2.position) {
      return [
        op1,
        { ...op2, position: op2.position + (op1.content?.length || 0) }
      ]
    } else {
      return [
        { ...op1, position: op1.position + (op2.content?.length || 0) },
        op2
      ]
    }
  }

  private static transformInsertDelete(op1: Operation, op2: Operation): [Operation, Operation] {
    if (op1.position <= op2.position) {
      return [
        op1,
        { ...op2, position: op2.position + (op1.content?.length || 0) }
      ]
    } else if (op1.position >= op2.position + (op2.length || 0)) {
      return [
        { ...op1, position: op1.position - (op2.length || 0) },
        op2
      ]
    } else {
      // Insert is within delete range - complex case
      return [
        { ...op1, position: op2.position },
        { ...op2, length: (op2.length || 0) + (op1.content?.length || 0) }
      ]
    }
  }

  private static transformDeleteDelete(op1: Operation, op2: Operation): [Operation, Operation] {
    const op1End = op1.position + (op1.length || 0)
    const op2End = op2.position + (op2.length || 0)

    if (op1End <= op2.position) {
      // op1 is completely before op2
      return [
        op1,
        { ...op2, position: op2.position - (op1.length || 0) }
      ]
    } else if (op2End <= op1.position) {
      // op2 is completely before op1
      return [
        { ...op1, position: op1.position - (op2.length || 0) },
        op2
      ]
    } else {
      // Overlapping deletes - merge them
      const newPosition = Math.min(op1.position, op2.position)
      const newLength = Math.max(op1End, op2End) - newPosition
      
      return [
        { ...op1, position: newPosition, length: newLength },
        { ...op2, position: newPosition, length: 0 } // Nullified
      ]
    }
  }

  private static transformWithRetain(op1: Operation, op2: Operation): [Operation, Operation] {
    // Retain operations don't change content, just cursor positions
    if (op1.type === 'retain') {
      return [op1, op2]
    } else {
      return [op1, op2]
    }
  }

  // Apply operation to document content
  static applyOperation(content: string, operation: Operation): string {
    switch (operation.type) {
      case 'insert':
        return content.slice(0, operation.position) + 
               (operation.content || '') + 
               content.slice(operation.position)
      
      case 'delete':
        return content.slice(0, operation.position) + 
               content.slice(operation.position + (operation.length || 0))
      
      case 'retain':
        return content // No change for retain operations
      
      default:
        return content
    }
  }

  // Compose multiple operations into a single operation
  static compose(ops: Operation[]): Operation[] {
    if (ops.length === 0) return []
    if (ops.length === 1) return ops

    const composed: Operation[] = []
    let currentOp = ops[0]

    for (let i = 1; i < ops.length; i++) {
      const nextOp = ops[i]
      
      // Try to merge operations
      if (this.canMerge(currentOp, nextOp)) {
        currentOp = this.merge(currentOp, nextOp)
      } else {
        composed.push(currentOp)
        currentOp = nextOp
      }
    }
    
    composed.push(currentOp)
    return composed
  }

  private static canMerge(op1: Operation, op2: Operation): boolean {
    return op1.type === op2.type && 
           op1.userId === op2.userId &&
           op1.type === 'insert' && 
           op1.position + (op1.content?.length || 0) === op2.position
  }

  private static merge(op1: Operation, op2: Operation): Operation {
    return {
      ...op1,
      content: (op1.content || '') + (op2.content || ''),
      timestamp: op2.timestamp
    }
  }
}

// Collaborative Document Manager
export class CollaborativeDocumentManager {
  private documents: Map<string, DocumentState> = new Map()
  private cursors: Map<string, Map<string, CursorPosition>> = new Map() // docId -> userId -> cursor
  private typingIndicators: Map<string, Map<string, TypingIndicator>> = new Map()
  private websocketManager: EnterpriseWebSocketManager
  private redisManager: RedisManager
  private monitoring: EnterpriseMonitoring

  constructor(websocketManager: EnterpriseWebSocketManager) {
    this.websocketManager = websocketManager
    this.redisManager = RedisManager.getInstance()
    this.monitoring = EnterpriseMonitoring.getInstance()
    
    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    // Handle document operations
    this.websocketManager.getSocketIO().on('connection', (socket) => {
      socket.on('document:join', (data) => this.handleDocumentJoin(socket, data))
      socket.on('document:operation', (data) => this.handleDocumentOperation(socket, data))
      socket.on('document:cursor', (data) => this.handleCursorUpdate(socket, data))
      socket.on('document:typing', (data) => this.handleTypingIndicator(socket, data))
      socket.on('document:leave', (data) => this.handleDocumentLeave(socket, data))
    })
  }

  async createDocument(id: string, initialContent = '', userId: string): Promise<DocumentState> {
    const document: DocumentState = {
      id,
      content: initialContent,
      version: 0,
      operations: [],
      participants: new Set([userId]),
      lastModified: new Date(),
      metadata: {
        createdBy: userId,
        createdAt: new Date()
      }
    }

    this.documents.set(id, document)
    this.cursors.set(id, new Map())
    this.typingIndicators.set(id, new Map())

    // Persist to Redis
    await this.persistDocument(document)

    this.monitoring.recordMetric('collaboration.documents.created', 1, { userId })
    return document
  }

  async getDocument(id: string): Promise<DocumentState | null> {
    let document = this.documents.get(id)
    
    if (!document) {
      // Try to load from Redis
      document = await this.loadDocument(id)
      if (document) {
        this.documents.set(id, document)
        this.cursors.set(id, new Map())
        this.typingIndicators.set(id, new Map())
      }
    }

    return document || null
  }

  private async handleDocumentJoin(socket: any, data: { documentId: string; userId: string }): Promise<void> {
    try {
      const { documentId, userId } = data
      const document = await this.getDocument(documentId)

      if (!document) {
        socket.emit('document:error', { message: 'Document not found' })
        return
      }

      // Add user to participants
      document.participants.add(userId)
      
      // Join socket room
      await socket.join(`document:${documentId}`)

      // Send current document state
      socket.emit('document:state', {
        id: document.id,
        content: document.content,
        version: document.version,
        participants: Array.from(document.participants),
        cursors: this.getDocumentCursors(documentId),
        typingIndicators: this.getDocumentTypingIndicators(documentId)
      })

      // Notify other participants
      socket.to(`document:${documentId}`).emit('document:user_joined', {
        userId,
        participantCount: document.participants.size
      })

      this.monitoring.recordMetric('collaboration.document.joins', 1, { documentId })
      
    } catch (error) {
      console.error('Error handling document join:', error)
      socket.emit('document:error', { message: 'Failed to join document' })
    }
  }

  private async handleDocumentOperation(socket: any, data: { documentId: string; operation: Operation }): Promise<void> {
    try {
      const { documentId, operation } = data
      const document = this.documents.get(documentId)

      if (!document) {
        socket.emit('document:error', { message: 'Document not found' })
        return
      }

      // Validate operation
      if (!this.validateOperation(operation, document)) {
        socket.emit('document:error', { message: 'Invalid operation' })
        return
      }

      // Transform operation against concurrent operations
      const transformedOperation = await this.transformOperation(operation, document)

      // Apply operation to document
      document.content = OperationalTransform.applyOperation(document.content, transformedOperation)
      document.version++
      document.operations.push(transformedOperation)
      document.lastModified = new Date()

      // Broadcast to other participants
      socket.to(`document:${documentId}`).emit('document:operation', {
        operation: transformedOperation,
        version: document.version
      })

      // Persist changes
      await this.persistDocument(document)

      this.monitoring.recordMetric('collaboration.operations.applied', 1, {
        documentId,
        operationType: operation.type,
        userId: operation.userId
      })

    } catch (error) {
      console.error('Error handling document operation:', error)
      socket.emit('document:error', { message: 'Failed to apply operation' })
    }
  }

  private async handleCursorUpdate(socket: any, data: { documentId: string; cursor: CursorPosition }): Promise<void> {
    const { documentId, cursor } = data
    const documentCursors = this.cursors.get(documentId)

    if (!documentCursors) return

    documentCursors.set(cursor.userId, cursor)

    // Broadcast cursor position to other participants
    socket.to(`document:${documentId}`).emit('document:cursor', cursor)

    this.monitoring.recordMetric('collaboration.cursor.updates', 1, { documentId })
  }

  private async handleTypingIndicator(socket: any, data: { documentId: string; indicator: TypingIndicator }): Promise<void> {
    const { documentId, indicator } = data
    const documentTyping = this.typingIndicators.get(documentId)

    if (!documentTyping) return

    if (indicator.isTyping) {
      documentTyping.set(indicator.userId, indicator)
    } else {
      documentTyping.delete(indicator.userId)
    }

    // Broadcast typing indicator to other participants
    socket.to(`document:${documentId}`).emit('document:typing', indicator)

    this.monitoring.recordMetric('collaboration.typing.indicators', 1, { documentId })
  }

  private async handleDocumentLeave(socket: any, data: { documentId: string; userId: string }): Promise<void> {
    const { documentId, userId } = data
    const document = this.documents.get(documentId)

    if (!document) return

    // Remove user from participants
    document.participants.delete(userId)

    // Remove cursor and typing indicator
    this.cursors.get(documentId)?.delete(userId)
    this.typingIndicators.get(documentId)?.delete(userId)

    // Leave socket room
    await socket.leave(`document:${documentId}`)

    // Notify other participants
    socket.to(`document:${documentId}`).emit('document:user_left', {
      userId,
      participantCount: document.participants.size
    })

    this.monitoring.recordMetric('collaboration.document.leaves', 1, { documentId })
  }

  private validateOperation(operation: Operation, document: DocumentState): boolean {
    // Check if operation is valid for current document state
    if (operation.version !== document.version) {
      return false
    }

    if (operation.type === 'insert') {
      return operation.position >= 0 && 
             operation.position <= document.content.length &&
             operation.content !== undefined
    }

    if (operation.type === 'delete') {
      return operation.position >= 0 && 
             operation.position < document.content.length &&
             operation.length !== undefined &&
             operation.length > 0 &&
             operation.position + operation.length <= document.content.length
    }

    return true
  }

  private async transformOperation(operation: Operation, document: DocumentState): Promise<Operation> {
    // Get all operations since the operation's version
    const concurrentOps = document.operations.filter(op => op.version >= operation.version)
    
    let transformedOp = operation
    
    // Transform against each concurrent operation
    for (const concurrentOp of concurrentOps) {
      if (concurrentOp.userId !== operation.userId) {
        const [transformed] = OperationalTransform.transform(transformedOp, concurrentOp)
        transformedOp = transformed
      }
    }

    // Update operation metadata
    transformedOp.version = document.version
    transformedOp.timestamp = new Date()

    return transformedOp
  }

  private getDocumentCursors(documentId: string): CursorPosition[] {
    const cursors = this.cursors.get(documentId)
    return cursors ? Array.from(cursors.values()) : []
  }

  private getDocumentTypingIndicators(documentId: string): TypingIndicator[] {
    const indicators = this.typingIndicators.get(documentId)
    return indicators ? Array.from(indicators.values()).filter(i => i.isTyping) : []
  }

  private async persistDocument(document: DocumentState): Promise<void> {
    try {
      const redis = this.redisManager.getClient()
      const key = `document:${document.id}`
      
      await redis.hset(key, {
        content: document.content,
        version: document.version.toString(),
        lastModified: document.lastModified.toISOString(),
        metadata: JSON.stringify(document.metadata),
        participants: JSON.stringify(Array.from(document.participants))
      })

      // Store recent operations (last 100)
      const recentOps = document.operations.slice(-100)
      await redis.set(`${key}:operations`, JSON.stringify(recentOps))

      // Set expiration (30 days)
      await redis.expire(key, 30 * 24 * 60 * 60)
      
    } catch (error) {
      console.error('Error persisting document:', error)
      this.monitoring.recordMetric('collaboration.persistence.errors', 1)
    }
  }

  private async loadDocument(id: string): Promise<DocumentState | null> {
    try {
      const redis = this.redisManager.getClient()
      const key = `document:${id}`
      
      const data = await redis.hgetall(key)
      if (!data.content) return null

      const operations = await redis.get(`${key}:operations`)
      
      return {
        id,
        content: data.content,
        version: parseInt(data.version) || 0,
        operations: operations ? JSON.parse(operations) : [],
        participants: new Set(JSON.parse(data.participants || '[]')),
        lastModified: new Date(data.lastModified),
        metadata: JSON.parse(data.metadata || '{}')
      }
      
    } catch (error) {
      console.error('Error loading document:', error)
      return null
    }
  }

  // Public API methods
  public async getDocumentHistory(documentId: string, limit = 100): Promise<Operation[]> {
    const document = await this.getDocument(documentId)
    if (!document) return []

    return document.operations.slice(-limit)
  }

  public async getDocumentParticipants(documentId: string): Promise<string[]> {
    const document = await this.getDocument(documentId)
    return document ? Array.from(document.participants) : []
  }

  public async deleteDocument(documentId: string, userId: string): Promise<boolean> {
    try {
      const document = this.documents.get(documentId)
      if (!document) return false

      // Check permissions (implement your authorization logic)
      if (document.metadata.createdBy !== userId) {
        return false
      }

      // Remove from memory
      this.documents.delete(documentId)
      this.cursors.delete(documentId)
      this.typingIndicators.delete(documentId)

      // Remove from Redis
      const redis = this.redisManager.getClient()
      await redis.del(`document:${documentId}`)
      await redis.del(`document:${documentId}:operations`)

      // Notify participants
      this.websocketManager.broadcastToRoom(`document:${documentId}`, 'document:deleted', {
        documentId,
        deletedBy: userId
      })

      this.monitoring.recordMetric('collaboration.documents.deleted', 1, { userId })
      return true

    } catch (error) {
      console.error('Error deleting document:', error)
      return false
    }
  }

  public getActiveDocuments(): string[] {
    return Array.from(this.documents.keys())
  }

  public getCollaborationStats() {
    return {
      activeDocuments: this.documents.size,
      totalParticipants: Array.from(this.documents.values())
        .reduce((sum, doc) => sum + doc.participants.size, 0),
      totalOperations: Array.from(this.documents.values())
        .reduce((sum, doc) => sum + doc.operations.length, 0)
    }
  }
}

// Document Version Control
export class DocumentVersionControl {
  private versions: Map<string, DocumentState[]> = new Map()
  private redisManager: RedisManager

  constructor() {
    this.redisManager = RedisManager.getInstance()
  }

  async saveVersion(document: DocumentState, comment?: string): Promise<string> {
    const versionId = `${document.id}_v${Date.now()}`
    const versionData = {
      ...document,
      versionId,
      comment,
      savedAt: new Date()
    }

    // Store in memory
    if (!this.versions.has(document.id)) {
      this.versions.set(document.id, [])
    }
    this.versions.get(document.id)!.push(versionData)

    // Persist to Redis
    const redis = this.redisManager.getClient()
    await redis.lpush(`versions:${document.id}`, JSON.stringify(versionData))
    await redis.ltrim(`versions:${document.id}`, 0, 50) // Keep last 50 versions

    return versionId
  }

  async getVersions(documentId: string): Promise<DocumentState[]> {
    let versions = this.versions.get(documentId)
    
    if (!versions) {
      // Load from Redis
      const redis = this.redisManager.getClient()
      const versionData = await redis.lrange(`versions:${documentId}`, 0, -1)
      versions = versionData.map(data => JSON.parse(data))
      this.versions.set(documentId, versions)
    }

    return versions || []
  }

  async restoreVersion(documentId: string, versionId: string): Promise<DocumentState | null> {
    const versions = await this.getVersions(documentId)
    const version = versions.find(v => (v as any).versionId === versionId)
    
    if (!version) return null

    // Create new document state from version
    return {
      id: documentId,
      content: version.content,
      version: version.version + 1,
      operations: [],
      participants: new Set(),
      lastModified: new Date(),
      metadata: {
        ...version.metadata,
        restoredFrom: versionId,
        restoredAt: new Date()
      }
    }
  }
}