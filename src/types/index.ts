import { User, Workspace, Board, Column, Task, Comment, Activity } from '@prisma/client'

export type UserWithRelations = User & {
  workspaces?: WorkspaceWithMembers[]
}

export type WorkspaceWithMembers = Workspace & {
  members: WorkspaceMemberWithUser[]
  boards: BoardWithColumns[]
}

export type WorkspaceMemberWithUser = {
  id: string
  userId: string
  workspaceId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  joinedAt: Date
  user: User
}

export type BoardWithColumns = Board & {
  columns: ColumnWithTasks[]
  createdBy: User
  activities?: ActivityWithUser[]
}

export type ColumnWithTasks = Column & {
  tasks: TaskWithDetails[]
}

export type TaskWithDetails = Task & {
  assignee?: User
  comments: CommentWithAuthor[]
  activities?: ActivityWithUser[]
}

export type CommentWithAuthor = Comment & {
  author: User
}

export type ActivityWithUser = Activity & {
  user: User
}

export interface SocketEvents {
  // Board events
  'board:join': (boardId: string) => void
  'board:leave': (boardId: string) => void
  'board:updated': (board: BoardWithColumns) => void
  
  // Task events
  'task:created': (task: TaskWithDetails) => void
  'task:updated': (task: TaskWithDetails) => void
  'task:moved': (taskId: string, sourceColumnId: string, targetColumnId: string, newOrder: number) => void
  'task:deleted': (taskId: string) => void
  
  // Column events
  'column:created': (column: ColumnWithTasks) => void
  'column:updated': (column: ColumnWithTasks) => void
  'column:deleted': (columnId: string) => void
  
  // Comment events
  'comment:created': (comment: CommentWithAuthor) => void
  'comment:updated': (comment: CommentWithAuthor) => void
  'comment:deleted': (commentId: string) => void
  
  // User presence
  'user:join': (user: User) => void
  'user:leave': (userId: string) => void
  'user:typing': (userId: string, taskId: string) => void
  'user:stop-typing': (userId: string, taskId: string) => void
}

export interface CreateTaskData {
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  columnId: string
  assigneeId?: string
  dueDate?: Date
}

export interface UpdateTaskData {
  title?: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  assigneeId?: string
  dueDate?: Date
}

export interface CreateColumnData {
  name: string
  boardId: string
  color?: string
}

export interface CreateBoardData {
  name: string
  description?: string
  workspaceId: string
  color?: string
}

export interface CreateWorkspaceData {
  name: string
  description?: string
}

export interface InviteMemberData {
  email: string
  role: 'ADMIN' | 'MEMBER'
  workspaceId: string
}