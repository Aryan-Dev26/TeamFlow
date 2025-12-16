'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { StorageManager } from '@/lib/storage'
import { useAuth } from '@/contexts/auth-context'

export function useTeamFlowData() {
  const { user } = useAuth()
  const [storage, setStorage] = useState<StorageManager | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize storage when user changes
  useEffect(() => {
    try {
      if (user) {
        const storageInstance = StorageManager.getInstance(user.id)
        setStorage(storageInstance)
      } else {
        const storageInstance = StorageManager.getInstance()
        setStorage(storageInstance)
      }
      setIsInitialized(true)
    } catch (error) {
      console.error('Error initializing storage:', error)
      setStorage(null)
      setIsInitialized(true)
    }
  }, [user])

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Boards - use useMemo to ensure it updates with refreshTrigger
  const boards = useMemo(() => {
    if (!isInitialized || !storage) return []
    try {
      return storage.getBoards() || []
    } catch (error) {
      console.error('Error getting boards:', error)
      return []
    }
  }, [storage, refreshTrigger, isInitialized])
  const getBoardById = useCallback((id: string) => {
    if (!isInitialized || !storage) return null
    try {
      return storage.getBoardById(id) || null
    } catch (error) {
      console.error('Error getting board by id:', error)
      return null
    }
  }, [storage, refreshTrigger, isInitialized])
  
  const createBoard = useCallback((board: any) => {
    if (!isInitialized || !storage) return null
    try {
      const newBoard = storage.createBoard(board)
      refresh()
      return newBoard
    } catch (error) {
      console.error('Error creating board:', error)
      return null
    }
  }, [storage, refresh, isInitialized])

  const updateBoard = useCallback((id: string, updates: any) => {
    if (!isInitialized || !storage) return null
    try {
      const updatedBoard = storage.updateBoard(id, updates)
      refresh()
      return updatedBoard
    } catch (error) {
      console.error('Error updating board:', error)
      return null
    }
  }, [storage, refresh, isInitialized])

  // Columns
  const getColumnsByBoardId = useCallback((boardId: string) => {
    if (!isInitialized || !storage) return []
    try {
      return storage.getColumnsByBoardId(boardId) || []
    } catch (error) {
      console.error('Error getting columns:', error)
      return []
    }
  }, [storage, refreshTrigger, isInitialized])

  const createColumn = useCallback((column: any) => {
    if (!isInitialized || !storage) return null
    try {
      const newColumn = storage.createColumn(column)
      refresh()
      return newColumn
    } catch (error) {
      console.error('Error creating column:', error)
      return null
    }
  }, [storage, refresh, isInitialized])

  // Tasks
  const getTasksByColumnId = useCallback((columnId: string) => {
    if (!isInitialized || !storage) return []
    try {
      return storage.getTasksByColumnId(columnId) || []
    } catch (error) {
      console.error('Error getting tasks:', error)
      return []
    }
  }, [storage, refreshTrigger, isInitialized])

  const getTaskById = useCallback((id: string) => {
    if (!isInitialized || !storage) return null
    try {
      return storage.getTaskById(id) || null
    } catch (error) {
      console.error('Error getting task by id:', error)
      return null
    }
  }, [storage, refreshTrigger, isInitialized])

  const createTask = useCallback((task: any) => {
    if (!isInitialized || !storage) return null
    try {
      const newTask = storage.createTask(task)
      refresh()
      return newTask
    } catch (error) {
      console.error('Error creating task:', error)
      return null
    }
  }, [storage, refresh, isInitialized])

  const updateTask = useCallback((id: string, updates: any) => {
    if (!isInitialized || !storage) return null
    try {
      const updatedTask = storage.updateTask(id, updates)
      refresh()
      return updatedTask
    } catch (error) {
      console.error('Error updating task:', error)
      return null
    }
  }, [storage, refresh, isInitialized])

  const deleteTask = useCallback((id: string) => {
    if (!isInitialized || !storage) return false
    try {
      const success = storage.deleteTask(id)
      if (success) refresh()
      return success
    } catch (error) {
      console.error('Error deleting task:', error)
      return false
    }
  }, [storage, refresh, isInitialized])

  const moveTask = useCallback((taskId: string, newColumnId: string, newOrder: number) => {
    if (!isInitialized || !storage) return false
    try {
      const success = storage.moveTask(taskId, newColumnId, newOrder)
      if (success) refresh()
      return success
    } catch (error) {
      console.error('Error moving task:', error)
      return false
    }
  }, [storage, refresh, isInitialized])

  // Comments
  const getCommentsByTaskId = useCallback((taskId: string) => {
    if (!isInitialized || !storage) return []
    try {
      return storage.getCommentsByTaskId(taskId) || []
    } catch (error) {
      console.error('Error getting comments:', error)
      return []
    }
  }, [storage, refreshTrigger, isInitialized])

  const createComment = useCallback((comment: any) => {
    if (!isInitialized || !storage) return null
    try {
      const newComment = storage.createComment(comment)
      refresh()
      return newComment
    } catch (error) {
      console.error('Error creating comment:', error)
      return null
    }
  }, [storage, refresh, isInitialized])

  // Activities
  const getActivities = useCallback((limit?: number) => {
    if (!isInitialized || !storage) return []
    try {
      return storage.getActivities(limit) || []
    } catch (error) {
      console.error('Error getting activities:', error)
      return []
    }
  }, [storage, refreshTrigger, isInitialized])

  // User - use auth user if available, otherwise storage user
  const storageUser = useMemo(() => {
    if (!isInitialized || !storage) return null
    try {
      return storage.getUser()
    } catch (error) {
      console.error('Error getting storage user:', error)
      return null
    }
  }, [storage, isInitialized, refreshTrigger])
  
  const currentUser = user || storageUser

  // Update storage user when auth user changes
  useEffect(() => {
    if (user && storage && isInitialized) {
      try {
        const storageUser = storage.getUser()
        if (storageUser && (storageUser.id !== user.id || storageUser.name !== user.name || storageUser.email !== user.email)) {
          storage.updateUser({
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            initials: user.initials
          })
          refresh()
        }
      } catch (error) {
        console.error('Error updating storage user:', error)
      }
    }
  }, [user, storage, refresh, isInitialized])
  
  const updateUser = useCallback((updates: any) => {
    if (!isInitialized || !storage) return null
    try {
      const updatedUser = storage.updateUser(updates)
      refresh()
      return updatedUser
    } catch (error) {
      console.error('Error updating user:', error)
      return null
    }
  }, [storage, refresh, isInitialized])

  // Utilities
  const exportData = useCallback(() => {
    if (!isInitialized || !storage) return ''
    try {
      return storage.exportData() || ''
    } catch (error) {
      console.error('Error exporting data:', error)
      return ''
    }
  }, [storage, isInitialized])
  
  const importData = useCallback((jsonData: string) => {
    if (!isInitialized || !storage) return false
    try {
      const success = storage.importData(jsonData)
      if (success) refresh()
      return success
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  }, [storage, refresh, isInitialized])

  const resetData = useCallback(() => {
    if (!isInitialized || !storage) return
    try {
      storage.resetData()
      refresh()
    } catch (error) {
      console.error('Error resetting data:', error)
    }
  }, [storage, refresh, isInitialized])

  // Return the hook data - all methods now have proper safety checks
  return {
    // Data
    boards: boards || [],
    user: currentUser,
    
    // Board methods
    getBoardById,
    createBoard,
    updateBoard,
    
    // Column methods
    getColumnsByBoardId,
    createColumn,
    
    // Task methods
    getTasksByColumnId,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    
    // Comment methods
    getCommentsByTaskId,
    createComment,
    
    // Activity methods
    getActivities,
    
    // User methods
    updateUser,
    
    // Utility methods
    exportData,
    importData,
    resetData,
    refresh
  }
}