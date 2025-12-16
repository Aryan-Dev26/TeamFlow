// Real-time collaboration system
export interface RealtimeUser {
  id: string
  name: string
  avatar?: string
  initials: string
  cursor?: { x: number; y: number }
  activeTask?: string
  lastSeen: string
}

export interface RealtimeEvent {
  type: 'user_join' | 'user_leave' | 'cursor_move' | 'task_update' | 'typing' | 'activity'
  userId: string
  data: any
  timestamp: string
}

export class RealtimeManager {
  private static instance: RealtimeManager
  private users: Map<string, RealtimeUser> = new Map()
  private listeners: Map<string, Function[]> = new Map()
  private currentUser: RealtimeUser | null = null

  static getInstance(): RealtimeManager {
    if (!RealtimeManager.instance) {
      RealtimeManager.instance = new RealtimeManager()
    }
    return RealtimeManager.instance
  }

  setCurrentUser(user: RealtimeUser) {
    this.currentUser = user
    this.users.set(user.id, user)
    this.emit('user_join', { user })
  }

  updateUserCursor(x: number, y: number) {
    if (!this.currentUser) return
    
    this.currentUser.cursor = { x, y }
    this.users.set(this.currentUser.id, this.currentUser)
    this.emit('cursor_move', { userId: this.currentUser.id, cursor: { x, y } })
  }

  setActiveTask(taskId: string) {
    if (!this.currentUser) return
    
    this.currentUser.activeTask = taskId
    this.users.set(this.currentUser.id, this.currentUser)
    this.emit('task_focus', { userId: this.currentUser.id, taskId })
  }

  getActiveUsers(): RealtimeUser[] {
    return Array.from(this.users.values())
  }

  getUsersOnTask(taskId: string): RealtimeUser[] {
    return Array.from(this.users.values()).filter(user => user.activeTask === taskId)
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(data))
    }
  }

  // Simulate real-time updates for demo
  simulateActivity() {
    const activities = [
      'Sarah updated task "Design Homepage"',
      'Mike completed "API Integration"',
      'Alex commented on "User Authentication"',
      'Emma moved task to "In Review"',
      'John created new task "Mobile Testing"'
    ]

    setInterval(() => {
      const activity = activities[Math.floor(Math.random() * activities.length)]
      this.emit('activity', { 
        message: activity, 
        timestamp: new Date().toISOString(),
        type: 'info'
      })
    }, 15000) // Every 15 seconds
  }
}