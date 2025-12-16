// Local storage utilities for persistent data
export interface StorageData {
  boards: any[]
  tasks: any[]
  columns: any[]
  workspaces: any[]
  user: any
  comments: any[]
  activities: any[]
}

const STORAGE_KEY = 'teamflow_data'

// Initialize default data structure
const defaultData: StorageData = {
  boards: [
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Design and development of the new company website',
      workspaceId: 'workspace-1',
      createdAt: new Date().toISOString(),
      color: '#3B82F6'
    }
  ],
  columns: [
    { id: 'todo', title: 'To Do', boardId: '1', order: 0, color: 'bg-gray-500' },
    { id: 'in-progress', title: 'In Progress', boardId: '1', order: 1, color: 'bg-blue-500' },
    { id: 'review', title: 'Review', boardId: '1', order: 2, color: 'bg-purple-500' },
    { id: 'done', title: 'Done', boardId: '1', order: 3, color: 'bg-green-500' }
  ],
  tasks: [
    {
      id: 'task-1',
      title: 'Design new landing page',
      description: 'Create a modern, responsive landing page for the new product launch',
      priority: 'High',
      columnId: 'todo',
      assignee: { name: 'Sarah Chen', initials: 'SC', avatar: '/avatars/sarah.jpg' },
      dueDate: '2024-12-20',
      tags: ['Design', 'Frontend'],
      comments: 3,
      attachments: 2,
      createdAt: new Date().toISOString(),
      order: 0
    },
    {
      id: 'task-2',
      title: 'User research interviews',
      description: 'Conduct 10 user interviews to validate product assumptions',
      priority: 'Medium',
      columnId: 'todo',
      assignee: { name: 'Mike Johnson', initials: 'MJ', avatar: '/avatars/mike.jpg' },
      dueDate: '2024-12-22',
      tags: ['Research', 'UX'],
      comments: 1,
      attachments: 0,
      createdAt: new Date().toISOString(),
      order: 1
    },
    {
      id: 'task-3',
      title: 'Implement authentication system',
      description: 'Build secure login/signup with JWT tokens and OAuth integration',
      priority: 'High',
      columnId: 'in-progress',
      assignee: { name: 'Alex Kim', initials: 'AK', avatar: '/avatars/alex.jpg' },
      dueDate: '2024-12-18',
      tags: ['Backend', 'Security'],
      comments: 5,
      attachments: 1,
      createdAt: new Date().toISOString(),
      order: 0
    },
    {
      id: 'task-4',
      title: 'Mobile app wireframes',
      description: 'Create detailed wireframes for iOS and Android applications',
      priority: 'Medium',
      columnId: 'in-progress',
      assignee: { name: 'Emma Wilson', initials: 'EW', avatar: '/avatars/emma.jpg' },
      dueDate: '2024-12-25',
      tags: ['Design', 'Mobile'],
      comments: 2,
      attachments: 3,
      createdAt: new Date().toISOString(),
      order: 1
    },
    {
      id: 'task-5',
      title: 'API documentation',
      description: 'Complete REST API documentation with examples and schemas',
      priority: 'Low',
      columnId: 'review',
      assignee: { name: 'John Doe', initials: 'JD', avatar: '/avatars/john.jpg' },
      dueDate: '2024-12-28',
      tags: ['Documentation', 'API'],
      comments: 1,
      attachments: 0,
      createdAt: new Date().toISOString(),
      order: 0
    },
    {
      id: 'task-6',
      title: 'Database schema design',
      description: 'Design and implement the core database schema for user management',
      priority: 'High',
      columnId: 'done',
      assignee: { name: 'Sarah Chen', initials: 'SC', avatar: '/avatars/sarah.jpg' },
      dueDate: '2024-12-15',
      tags: ['Database', 'Backend'],
      comments: 4,
      attachments: 2,
      createdAt: new Date().toISOString(),
      order: 0
    }
  ],
  workspaces: [
    {
      id: 'workspace-1',
      name: 'Design Team',
      description: 'Creative design and user experience team',
      createdAt: new Date().toISOString()
    }
  ],
  user: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: '/avatars/john.jpg',
    initials: 'JD'
  },
  comments: [
    {
      id: 'comment-1',
      taskId: 'task-1',
      content: "I've started working on the wireframes. Should have the first draft ready by tomorrow.",
      author: { name: 'Sarah Chen', initials: 'SC', avatar: '/avatars/sarah.jpg' },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      reactions: ['👍', '🎉']
    },
    {
      id: 'comment-2',
      taskId: 'task-1',
      content: "Great! Make sure to consider the mobile-first approach we discussed.",
      author: { name: 'Mike Johnson', initials: 'MJ', avatar: '/avatars/mike.jpg' },
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      reactions: ['👍']
    }
  ],
  activities: [
    {
      id: 'activity-1',
      type: 'task_created',
      content: 'Task "Design new landing page" was created',
      userId: 'user-1',
      taskId: 'task-1',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    },
    {
      id: 'activity-2',
      type: 'task_moved',
      content: 'Task "Implement authentication system" was moved to In Progress',
      userId: 'user-1',
      taskId: 'task-3',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    }
  ]
}

export class StorageManager {
  private static instance: StorageManager
  private data: StorageData

  private constructor() {
    this.data = this.loadData()
  }

  public static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager()
    }
    return StorageManager.instance
  }

  private loadData(): StorageData {
    if (typeof window === 'undefined') return defaultData
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedData = JSON.parse(stored)
        // Merge with default data to ensure all properties exist
        return { ...defaultData, ...parsedData }
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error)
    }
    
    // Initialize with default data
    this.saveData(defaultData)
    return defaultData
  }

  private saveData(data: StorageData): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      this.data = data
    } catch (error) {
      console.error('Error saving data to localStorage:', error)
    }
  }

  // Boards
  public getBoards(): any[] {
    return this.data.boards
  }

  public getBoardById(id: string): any | null {
    return this.data.boards.find(board => board.id === id) || null
  }

  public createBoard(board: any): any {
    const newBoard = {
      ...board,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    }
    this.data.boards.push(newBoard)
    this.saveData(this.data)
    return newBoard
  }

  public updateBoard(id: string, updates: any): any | null {
    const index = this.data.boards.findIndex(board => board.id === id)
    if (index === -1) return null
    
    this.data.boards[index] = { ...this.data.boards[index], ...updates }
    this.saveData(this.data)
    return this.data.boards[index]
  }

  // Columns
  public getColumnsByBoardId(boardId: string): any[] {
    return this.data.columns
      .filter(column => column.boardId === boardId)
      .sort((a, b) => a.order - b.order)
  }

  public createColumn(column: any): any {
    const newColumn = {
      ...column,
      id: this.generateId(),
      order: this.data.columns.filter(c => c.boardId === column.boardId).length
    }
    this.data.columns.push(newColumn)
    this.saveData(this.data)
    return newColumn
  }

  // Tasks
  public getTasksByColumnId(columnId: string): any[] {
    return this.data.tasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.order - b.order)
  }

  public getTaskById(id: string): any | null {
    return this.data.tasks.find(task => task.id === id) || null
  }

  public createTask(task: any): any {
    const columnTasks = this.getTasksByColumnId(task.columnId)
    const newTask = {
      ...task,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      order: columnTasks.length,
      comments: 0,
      attachments: 0
    }
    this.data.tasks.push(newTask)
    this.saveData(this.data)
    
    // Add activity
    this.addActivity({
      type: 'task_created',
      content: `Task "${newTask.title}" was created`,
      taskId: newTask.id
    })
    
    return newTask
  }

  public updateTask(id: string, updates: any): any | null {
    const index = this.data.tasks.findIndex(task => task.id === id)
    if (index === -1) return null
    
    const oldTask = this.data.tasks[index]
    this.data.tasks[index] = { ...oldTask, ...updates }
    this.saveData(this.data)
    
    // Add activity for column changes
    if (updates.columnId && updates.columnId !== oldTask.columnId) {
      const newColumn = this.data.columns.find(c => c.id === updates.columnId)
      this.addActivity({
        type: 'task_moved',
        content: `Task "${this.data.tasks[index].title}" was moved to ${newColumn?.title}`,
        taskId: id
      })
    }
    
    return this.data.tasks[index]
  }

  public deleteTask(id: string): boolean {
    const index = this.data.tasks.findIndex(task => task.id === id)
    if (index === -1) return false
    
    const task = this.data.tasks[index]
    this.data.tasks.splice(index, 1)
    
    // Remove related comments
    this.data.comments = this.data.comments.filter(comment => comment.taskId !== id)
    
    this.saveData(this.data)
    
    this.addActivity({
      type: 'task_deleted',
      content: `Task "${task.title}" was deleted`,
      taskId: id
    })
    
    return true
  }

  public moveTask(taskId: string, newColumnId: string, newOrder: number): boolean {
    const task = this.getTaskById(taskId)
    if (!task) return false
    
    // Update all tasks in the target column
    const targetTasks = this.getTasksByColumnId(newColumnId)
    targetTasks.forEach((t, index) => {
      if (index >= newOrder) {
        this.updateTaskOrder(t.id, index + 1)
      }
    })
    
    // Update the moved task
    this.updateTask(taskId, { columnId: newColumnId, order: newOrder })
    return true
  }

  private updateTaskOrder(taskId: string, newOrder: number): void {
    const index = this.data.tasks.findIndex(task => task.id === taskId)
    if (index !== -1) {
      this.data.tasks[index].order = newOrder
    }
  }

  // Comments
  public getCommentsByTaskId(taskId: string): any[] {
    return this.data.comments
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  public createComment(comment: any): any {
    const newComment = {
      ...comment,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      reactions: []
    }
    this.data.comments.push(newComment)
    
    // Update task comment count
    const task = this.getTaskById(comment.taskId)
    if (task) {
      this.updateTask(task.id, { comments: (task.comments || 0) + 1 })
    }
    
    this.saveData(this.data)
    
    this.addActivity({
      type: 'comment_added',
      content: `Comment added to task "${task?.title}"`,
      taskId: comment.taskId
    })
    
    return newComment
  }

  // Activities
  public getActivities(limit: number = 10): any[] {
    return this.data.activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  }

  private addActivity(activity: any): void {
    const newActivity = {
      ...activity,
      id: this.generateId(),
      userId: this.data.user.id,
      createdAt: new Date().toISOString()
    }
    this.data.activities.push(newActivity)
    
    // Keep only last 100 activities
    if (this.data.activities.length > 100) {
      this.data.activities = this.data.activities.slice(-100)
    }
  }

  // User
  public getUser(): any {
    return this.data.user
  }

  public updateUser(updates: any): any {
    this.data.user = { ...this.data.user, ...updates }
    this.saveData(this.data)
    return this.data.user
  }

  // Utilities
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  // Export/Import
  public exportData(): string {
    return JSON.stringify(this.data, null, 2)
  }

  public importData(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData)
      this.saveData({ ...defaultData, ...importedData })
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }

  // Reset
  public resetData(): void {
    this.saveData(defaultData)
  }
}