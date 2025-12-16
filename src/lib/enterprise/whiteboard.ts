// Interactive Whiteboard System with Real-time Collaboration
import { EnterpriseWebSocketManager } from './websocket'
import { EnterpriseMonitoring } from './monitoring'
import { RedisManager } from './infrastructure'

// Whiteboard Drawing Elements
export interface DrawingElement {
  id: string
  type: 'pen' | 'line' | 'rectangle' | 'circle' | 'text' | 'image' | 'sticky-note'
  userId: string
  timestamp: Date
  position: Point
  properties: ElementProperties
  layer: number
  locked: boolean
}

export interface Point {
  x: number
  y: number
}

export interface ElementProperties {
  // Common properties
  color: string
  strokeWidth: number
  opacity: number
  
  // Shape-specific properties
  width?: number
  height?: number
  radius?: number
  text?: string
  fontSize?: number
  fontFamily?: string
  fill?: string
  
  // Path for pen/line drawings
  path?: Point[]
  
  // Image properties
  imageUrl?: string
  imageData?: string
  
  // Sticky note properties
  backgroundColor?: string
  textColor?: string
}

export interface WhiteboardState {
  id: string
  name: string
  elements: Map<string, DrawingElement>
  participants: Set<string>
  cursors: Map<string, WhiteboardCursor>
  version: number
  createdBy: string
  createdAt: Date
  lastModified: Date
  settings: WhiteboardSettings
  templates: WhiteboardTemplate[]
  metadata: Record<string, any>
}

export interface WhiteboardCursor {
  userId: string
  position: Point
  tool: string
  color: string
  isDrawing: boolean
  timestamp: Date
}

export interface WhiteboardSettings {
  width: number
  height: number
  backgroundColor: string
  gridEnabled: boolean
  gridSize: number
  snapToGrid: boolean
  allowAnonymous: boolean
  maxParticipants: number
  readOnly: boolean
}

export interface WhiteboardTemplate {
  id: string
  name: string
  description: string
  elements: DrawingElement[]
  thumbnail?: string
  category: string
  tags: string[]
}

// Drawing Operation for real-time sync
export interface DrawingOperation {
  id: string
  type: 'add' | 'update' | 'delete' | 'move' | 'resize'
  elementId: string
  element?: DrawingElement
  changes?: Partial<DrawingElement>
  userId: string
  timestamp: Date
  version: number
}

// Whiteboard Export Options
export interface ExportOptions {
  format: 'png' | 'jpg' | 'svg' | 'pdf'
  quality: number
  width?: number
  height?: number
  backgroundColor?: string
  includeGrid: boolean
}

// Interactive Whiteboard Manager
export class InteractiveWhiteboardManager {
  private whiteboards: Map<string, WhiteboardState> = new Map()
  private websocketManager: EnterpriseWebSocketManager
  private redisManager: RedisManager
  private monitoring: EnterpriseMonitoring
  private templates: Map<string, WhiteboardTemplate> = new Map()

  constructor(websocketManager: EnterpriseWebSocketManager) {
    this.websocketManager = websocketManager
    this.redisManager = RedisManager.getInstance()
    this.monitoring = EnterpriseMonitoring.getInstance()
    
    this.setupEventHandlers()
    this.loadDefaultTemplates()
    this.startCleanupTasks()
  }

  private setupEventHandlers(): void {
    this.websocketManager.getSocketIO().on('connection', (socket) => {
      // Whiteboard management
      socket.on('whiteboard:create', (data) => this.handleCreateWhiteboard(socket, data))
      socket.on('whiteboard:join', (data) => this.handleJoinWhiteboard(socket, data))
      socket.on('whiteboard:leave', (data) => this.handleLeaveWhiteboard(socket, data))
      
      // Drawing operations
      socket.on('whiteboard:draw', (data) => this.handleDrawOperation(socket, data))
      socket.on('whiteboard:cursor', (data) => this.handleCursorUpdate(socket, data))
      socket.on('whiteboard:select', (data) => this.handleElementSelection(socket, data))
      
      // Element operations
      socket.on('whiteboard:add-element', (data) => this.handleAddElement(socket, data))
      socket.on('whiteboard:update-element', (data) => this.handleUpdateElement(socket, data))
      socket.on('whiteboard:delete-element', (data) => this.handleDeleteElement(socket, data))
      socket.on('whiteboard:move-element', (data) => this.handleMoveElement(socket, data))
      
      // Collaboration features
      socket.on('whiteboard:lock-element', (data) => this.handleLockElement(socket, data))
      socket.on('whiteboard:unlock-element', (data) => this.handleUnlockElement(socket, data))
      
      // Export and templates
      socket.on('whiteboard:export', (data) => this.handleExportWhiteboard(socket, data))
      socket.on('whiteboard:save-template', (data) => this.handleSaveTemplate(socket, data))
      socket.on('whiteboard:load-template', (data) => this.handleLoadTemplate(socket, data))
    })
  }

  async createWhiteboard(
    userId: string,
    name: string,
    settings: Partial<WhiteboardSettings> = {}
  ): Promise<WhiteboardState> {
    const whiteboardId = this.generateWhiteboardId()
    
    const defaultSettings: WhiteboardSettings = {
      width: 1920,
      height: 1080,
      backgroundColor: '#ffffff',
      gridEnabled: true,
      gridSize: 20,
      snapToGrid: false,
      allowAnonymous: false,
      maxParticipants: 50,
      readOnly: false
    }

    const whiteboard: WhiteboardState = {
      id: whiteboardId,
      name,
      elements: new Map(),
      participants: new Set([userId]),
      cursors: new Map(),
      version: 0,
      createdBy: userId,
      createdAt: new Date(),
      lastModified: new Date(),
      settings: { ...defaultSettings, ...settings },
      templates: [],
      metadata: {}
    }

    this.whiteboards.set(whiteboardId, whiteboard)
    await this.persistWhiteboard(whiteboard)

    this.monitoring.recordMetric('whiteboard.created', 1, { userId })
    return whiteboard
  }

  private async handleCreateWhiteboard(socket: any, data: {
    name: string
    settings?: Partial<WhiteboardSettings>
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = await this.createWhiteboard(data.userId, data.name, data.settings)
      
      socket.emit('whiteboard:created', {
        whiteboardId: whiteboard.id,
        name: whiteboard.name,
        settings: whiteboard.settings
      })

    } catch (error) {
      console.error('Error creating whiteboard:', error)
      socket.emit('whiteboard:error', { message: 'Failed to create whiteboard' })
    }
  }

  private async handleJoinWhiteboard(socket: any, data: {
    whiteboardId: string
    userId: string
    userName: string
  }): Promise<void> {
    try {
      const whiteboard = await this.getWhiteboard(data.whiteboardId)
      if (!whiteboard) {
        socket.emit('whiteboard:error', { message: 'Whiteboard not found' })
        return
      }

      if (whiteboard.participants.size >= whiteboard.settings.maxParticipants) {
        socket.emit('whiteboard:error', { message: 'Whiteboard is full' })
        return
      }

      // Add participant
      whiteboard.participants.add(data.userId)

      // Join socket room
      await socket.join(`whiteboard:${data.whiteboardId}`)

      // Send current whiteboard state
      socket.emit('whiteboard:joined', {
        whiteboardId: data.whiteboardId,
        elements: Array.from(whiteboard.elements.values()),
        participants: Array.from(whiteboard.participants),
        cursors: Array.from(whiteboard.cursors.values()),
        settings: whiteboard.settings,
        version: whiteboard.version
      })

      // Notify other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:participant-joined', {
        userId: data.userId,
        userName: data.userName,
        participantCount: whiteboard.participants.size
      })

      this.monitoring.recordMetric('whiteboard.joined', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error joining whiteboard:', error)
      socket.emit('whiteboard:error', { message: 'Failed to join whiteboard' })
    }
  }

  private async handleLeaveWhiteboard(socket: any, data: {
    whiteboardId: string
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard) return

      // Remove participant
      whiteboard.participants.delete(data.userId)
      whiteboard.cursors.delete(data.userId)

      // Leave socket room
      await socket.leave(`whiteboard:${data.whiteboardId}`)

      // Notify other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:participant-left', {
        userId: data.userId,
        participantCount: whiteboard.participants.size
      })

      this.monitoring.recordMetric('whiteboard.left', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error leaving whiteboard:', error)
    }
  }

  private async handleDrawOperation(socket: any, data: {
    whiteboardId: string
    operation: DrawingOperation
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard || whiteboard.settings.readOnly) return

      const operation = data.operation
      operation.timestamp = new Date()
      operation.version = whiteboard.version + 1

      // Apply operation to whiteboard
      await this.applyDrawingOperation(whiteboard, operation)

      // Broadcast to other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:operation', {
        operation
      })

      // Persist changes
      await this.persistWhiteboard(whiteboard)

      this.monitoring.recordMetric('whiteboard.operations', 1, {
        whiteboardId: data.whiteboardId,
        operationType: operation.type
      })

    } catch (error) {
      console.error('Error handling draw operation:', error)
      socket.emit('whiteboard:error', { message: 'Failed to apply drawing operation' })
    }
  }

  private async handleCursorUpdate(socket: any, data: {
    whiteboardId: string
    cursor: WhiteboardCursor
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard) return

      const cursor = {
        ...data.cursor,
        timestamp: new Date()
      }

      whiteboard.cursors.set(cursor.userId, cursor)

      // Broadcast cursor position to other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:cursor', cursor)

      this.monitoring.recordMetric('whiteboard.cursor_updates', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error handling cursor update:', error)
    }
  }

  private async handleAddElement(socket: any, data: {
    whiteboardId: string
    element: DrawingElement
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard || whiteboard.settings.readOnly) return

      const element = {
        ...data.element,
        id: this.generateElementId(),
        timestamp: new Date()
      }

      const operation: DrawingOperation = {
        id: this.generateOperationId(),
        type: 'add',
        elementId: element.id,
        element,
        userId: element.userId,
        timestamp: new Date(),
        version: whiteboard.version + 1
      }

      await this.applyDrawingOperation(whiteboard, operation)

      // Broadcast to other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:element-added', {
        element
      })

      await this.persistWhiteboard(whiteboard)
      this.monitoring.recordMetric('whiteboard.elements.added', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error adding element:', error)
      socket.emit('whiteboard:error', { message: 'Failed to add element' })
    }
  }

  private async handleUpdateElement(socket: any, data: {
    whiteboardId: string
    elementId: string
    changes: Partial<DrawingElement>
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard || whiteboard.settings.readOnly) return

      const element = whiteboard.elements.get(data.elementId)
      if (!element) return

      // Check if element is locked by another user
      if (element.locked && element.userId !== data.userId) {
        socket.emit('whiteboard:error', { message: 'Element is locked by another user' })
        return
      }

      const operation: DrawingOperation = {
        id: this.generateOperationId(),
        type: 'update',
        elementId: data.elementId,
        changes: data.changes,
        userId: data.userId,
        timestamp: new Date(),
        version: whiteboard.version + 1
      }

      await this.applyDrawingOperation(whiteboard, operation)

      // Broadcast to other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:element-updated', {
        elementId: data.elementId,
        changes: data.changes
      })

      await this.persistWhiteboard(whiteboard)
      this.monitoring.recordMetric('whiteboard.elements.updated', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error updating element:', error)
      socket.emit('whiteboard:error', { message: 'Failed to update element' })
    }
  }

  private async handleDeleteElement(socket: any, data: {
    whiteboardId: string
    elementId: string
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard || whiteboard.settings.readOnly) return

      const element = whiteboard.elements.get(data.elementId)
      if (!element) return

      // Check permissions
      if (element.userId !== data.userId && whiteboard.createdBy !== data.userId) {
        socket.emit('whiteboard:error', { message: 'Permission denied' })
        return
      }

      const operation: DrawingOperation = {
        id: this.generateOperationId(),
        type: 'delete',
        elementId: data.elementId,
        userId: data.userId,
        timestamp: new Date(),
        version: whiteboard.version + 1
      }

      await this.applyDrawingOperation(whiteboard, operation)

      // Broadcast to other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:element-deleted', {
        elementId: data.elementId
      })

      await this.persistWhiteboard(whiteboard)
      this.monitoring.recordMetric('whiteboard.elements.deleted', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error deleting element:', error)
      socket.emit('whiteboard:error', { message: 'Failed to delete element' })
    }
  }

  private async handleMoveElement(socket: any, data: {
    whiteboardId: string
    elementId: string
    newPosition: Point
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard || whiteboard.settings.readOnly) return

      const element = whiteboard.elements.get(data.elementId)
      if (!element) return

      // Snap to grid if enabled
      let position = data.newPosition
      if (whiteboard.settings.snapToGrid) {
        const gridSize = whiteboard.settings.gridSize
        position = {
          x: Math.round(position.x / gridSize) * gridSize,
          y: Math.round(position.y / gridSize) * gridSize
        }
      }

      const operation: DrawingOperation = {
        id: this.generateOperationId(),
        type: 'move',
        elementId: data.elementId,
        changes: { position },
        userId: data.userId,
        timestamp: new Date(),
        version: whiteboard.version + 1
      }

      await this.applyDrawingOperation(whiteboard, operation)

      // Broadcast to other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:element-moved', {
        elementId: data.elementId,
        position
      })

      this.monitoring.recordMetric('whiteboard.elements.moved', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error moving element:', error)
    }
  }

  private async handleLockElement(socket: any, data: {
    whiteboardId: string
    elementId: string
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard) return

      const element = whiteboard.elements.get(data.elementId)
      if (!element) return

      element.locked = true
      whiteboard.version++
      whiteboard.lastModified = new Date()

      // Broadcast to other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:element-locked', {
        elementId: data.elementId,
        lockedBy: data.userId
      })

      this.monitoring.recordMetric('whiteboard.elements.locked', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error locking element:', error)
    }
  }

  private async handleUnlockElement(socket: any, data: {
    whiteboardId: string
    elementId: string
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard) return

      const element = whiteboard.elements.get(data.elementId)
      if (!element) return

      // Only the element owner or whiteboard creator can unlock
      if (element.userId !== data.userId && whiteboard.createdBy !== data.userId) {
        return
      }

      element.locked = false
      whiteboard.version++
      whiteboard.lastModified = new Date()

      // Broadcast to other participants
      socket.to(`whiteboard:${data.whiteboardId}`).emit('whiteboard:element-unlocked', {
        elementId: data.elementId
      })

      this.monitoring.recordMetric('whiteboard.elements.unlocked', 1, { whiteboardId: data.whiteboardId })

    } catch (error) {
      console.error('Error unlocking element:', error)
    }
  }

  private async handleExportWhiteboard(socket: any, data: {
    whiteboardId: string
    options: ExportOptions
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard) {
        socket.emit('whiteboard:error', { message: 'Whiteboard not found' })
        return
      }

      const exportUrl = await this.exportWhiteboard(whiteboard, data.options)
      
      socket.emit('whiteboard:exported', {
        whiteboardId: data.whiteboardId,
        exportUrl,
        format: data.options.format
      })

      this.monitoring.recordMetric('whiteboard.exports', 1, { 
        whiteboardId: data.whiteboardId,
        format: data.options.format 
      })

    } catch (error) {
      console.error('Error exporting whiteboard:', error)
      socket.emit('whiteboard:error', { message: 'Failed to export whiteboard' })
    }
  }

  private async handleSaveTemplate(socket: any, data: {
    whiteboardId: string
    templateName: string
    description: string
    category: string
    tags: string[]
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      if (!whiteboard) return

      const template: WhiteboardTemplate = {
        id: this.generateTemplateId(),
        name: data.templateName,
        description: data.description,
        elements: Array.from(whiteboard.elements.values()),
        category: data.category,
        tags: data.tags
      }

      this.templates.set(template.id, template)
      await this.persistTemplate(template)

      socket.emit('whiteboard:template-saved', {
        templateId: template.id,
        name: template.name
      })

      this.monitoring.recordMetric('whiteboard.templates.saved', 1, { userId: data.userId })

    } catch (error) {
      console.error('Error saving template:', error)
      socket.emit('whiteboard:error', { message: 'Failed to save template' })
    }
  }

  private async handleLoadTemplate(socket: any, data: {
    whiteboardId: string
    templateId: string
    userId: string
  }): Promise<void> {
    try {
      const whiteboard = this.whiteboards.get(data.whiteboardId)
      const template = this.templates.get(data.templateId)
      
      if (!whiteboard || !template) {
        socket.emit('whiteboard:error', { message: 'Whiteboard or template not found' })
        return
      }

      // Clear existing elements
      whiteboard.elements.clear()

      // Add template elements
      for (const element of template.elements) {
        const newElement = {
          ...element,
          id: this.generateElementId(),
          userId: data.userId,
          timestamp: new Date()
        }
        whiteboard.elements.set(newElement.id, newElement)
      }

      whiteboard.version++
      whiteboard.lastModified = new Date()

      // Broadcast to all participants
      this.websocketManager.broadcastToRoom(`whiteboard:${data.whiteboardId}`, 'whiteboard:template-loaded', {
        elements: Array.from(whiteboard.elements.values()),
        templateName: template.name
      })

      await this.persistWhiteboard(whiteboard)
      this.monitoring.recordMetric('whiteboard.templates.loaded', 1, { templateId: data.templateId })

    } catch (error) {
      console.error('Error loading template:', error)
      socket.emit('whiteboard:error', { message: 'Failed to load template' })
    }
  }

  private async applyDrawingOperation(whiteboard: WhiteboardState, operation: DrawingOperation): Promise<void> {
    switch (operation.type) {
      case 'add':
        if (operation.element) {
          whiteboard.elements.set(operation.elementId, operation.element)
        }
        break

      case 'update':
        const element = whiteboard.elements.get(operation.elementId)
        if (element && operation.changes) {
          Object.assign(element, operation.changes)
        }
        break

      case 'delete':
        whiteboard.elements.delete(operation.elementId)
        break

      case 'move':
        const moveElement = whiteboard.elements.get(operation.elementId)
        if (moveElement && operation.changes?.position) {
          moveElement.position = operation.changes.position
        }
        break
    }

    whiteboard.version = operation.version
    whiteboard.lastModified = operation.timestamp
  }

  private async exportWhiteboard(whiteboard: WhiteboardState, options: ExportOptions): Promise<string> {
    // This would integrate with a canvas rendering service
    // For now, return a mock URL
    const exportId = `export_${whiteboard.id}_${Date.now()}`
    return `https://your-cdn.com/exports/${exportId}.${options.format}`
  }

  private async getWhiteboard(id: string): Promise<WhiteboardState | null> {
    let whiteboard = this.whiteboards.get(id)
    
    if (!whiteboard) {
      whiteboard = await this.loadWhiteboard(id)
      if (whiteboard) {
        this.whiteboards.set(id, whiteboard)
      }
    }

    return whiteboard
  }

  private async persistWhiteboard(whiteboard: WhiteboardState): Promise<void> {
    try {
      const redis = this.redisManager.getClient()
      const key = `whiteboard:${whiteboard.id}`
      
      const whiteboardData = {
        ...whiteboard,
        elements: JSON.stringify(Array.from(whiteboard.elements.entries())),
        participants: JSON.stringify(Array.from(whiteboard.participants)),
        cursors: JSON.stringify(Array.from(whiteboard.cursors.entries()))
      }

      await redis.hset(key, whiteboardData)
      await redis.expire(key, 30 * 24 * 60 * 60) // 30 days

    } catch (error) {
      console.error('Error persisting whiteboard:', error)
    }
  }

  private async loadWhiteboard(id: string): Promise<WhiteboardState | null> {
    try {
      const redis = this.redisManager.getClient()
      const data = await redis.hgetall(`whiteboard:${id}`)
      
      if (!data.name) return null

      return {
        id,
        name: data.name,
        elements: new Map(JSON.parse(data.elements || '[]')),
        participants: new Set(JSON.parse(data.participants || '[]')),
        cursors: new Map(JSON.parse(data.cursors || '[]')),
        version: parseInt(data.version) || 0,
        createdBy: data.createdBy,
        createdAt: new Date(data.createdAt),
        lastModified: new Date(data.lastModified),
        settings: JSON.parse(data.settings),
        templates: JSON.parse(data.templates || '[]'),
        metadata: JSON.parse(data.metadata || '{}')
      }

    } catch (error) {
      console.error('Error loading whiteboard:', error)
      return null
    }
  }

  private async persistTemplate(template: WhiteboardTemplate): Promise<void> {
    try {
      const redis = this.redisManager.getClient()
      await redis.set(`template:${template.id}`, JSON.stringify(template))
      await redis.sadd('templates', template.id)

    } catch (error) {
      console.error('Error persisting template:', error)
    }
  }

  private loadDefaultTemplates(): void {
    // Load some default templates
    const defaultTemplates: WhiteboardTemplate[] = [
      {
        id: 'template_brainstorm',
        name: 'Brainstorming Session',
        description: 'Template for brainstorming with sticky notes and mind maps',
        elements: [],
        category: 'collaboration',
        tags: ['brainstorm', 'ideas', 'sticky-notes']
      },
      {
        id: 'template_flowchart',
        name: 'Flowchart',
        description: 'Basic flowchart template with common shapes',
        elements: [],
        category: 'diagrams',
        tags: ['flowchart', 'process', 'diagram']
      }
    ]

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  private startCleanupTasks(): void {
    // Clean up inactive whiteboards every hour
    setInterval(() => {
      const now = Date.now()
      const oneHourAgo = now - (60 * 60 * 1000)

      for (const [id, whiteboard] of this.whiteboards) {
        if (whiteboard.participants.size === 0 && 
            whiteboard.lastModified.getTime() < oneHourAgo) {
          this.whiteboards.delete(id)
        }
      }
    }, 60 * 60 * 1000)
  }

  private generateWhiteboardId(): string {
    return `wb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateElementId(): string {
    return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTemplateId(): string {
    return `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API methods
  public getActiveWhiteboards(): WhiteboardState[] {
    return Array.from(this.whiteboards.values()).filter(wb => wb.participants.size > 0)
  }

  public getWhiteboardStats() {
    const whiteboards = Array.from(this.whiteboards.values())
    return {
      total: whiteboards.length,
      active: whiteboards.filter(wb => wb.participants.size > 0).length,
      totalElements: whiteboards.reduce((sum, wb) => sum + wb.elements.size, 0),
      totalParticipants: whiteboards.reduce((sum, wb) => sum + wb.participants.size, 0),
      templates: this.templates.size
    }
  }

  public getTemplates(category?: string): WhiteboardTemplate[] {
    const templates = Array.from(this.templates.values())
    return category ? templates.filter(t => t.category === category) : templates
  }
}