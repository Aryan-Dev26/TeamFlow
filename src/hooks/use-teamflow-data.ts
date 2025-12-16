'use client'

import { useState, useEffect, useCallback } from 'react'
import { StorageManager } from '@/lib/storage'

export function useTeamFlowData() {
  const [storage] = useState(() => StorageManager.getInstance())
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  // Boards
  const boards = storage.getBoards()
  const getBoardById = useCallback((id: string) => storage.getBoardById(id), [storage])
  
  const createBoard = useCallback((board: any) => {
    const newBoard = storage.createBoard(board)
    refresh()
    return newBoard
  }, [storage, refresh])

  const updateBoard = useCallback((id: string, updates: any) => {
    const updatedBoard = storage.updateBoard(id, updates)
    refresh()
    return updatedBoard
  }, [storage, refresh])

  // Columns
  const getColumnsByBoardId = useCallback((boardId: string) => 
    storage.getColumnsByBoardId(boardId), [storage, refreshTrigger])

  const createColumn = useCallback((column: any) => {
    const newColumn = storage.createColumn(column)
    refresh()
    return newColumn
  }, [storage, refresh])

  // Tasks
  const getTasksByColumnId = useCallback((columnId: string) => 
    storage.getTasksByColumnId(columnId), [storage, refreshTrigger])

  const getTaskById = useCallback((id: string) => storage.getTaskById(id), [storage, refreshTrigger])

  const createTask = useCallback((task: any) => {
    const newTask = storage.createTask(task)
    refresh()
    return newTask
  }, [storage, refresh])

  const updateTask = useCallback((id: string, updates: any) => {
    const updatedTask = storage.updateTask(id, updates)
    refresh()
    return updatedTask
  }, [storage, refresh])

  const deleteTask = useCallback((id: string) => {
    const success = storage.deleteTask(id)
    if (success) refresh()
    return success
  }, [storage, refresh])

  const moveTask = useCallback((taskId: string, newColumnId: string, newOrder: number) => {
    const success = storage.moveTask(taskId, newColumnId, newOrder)
    if (success) refresh()
    return success
  }, [storage, refresh])

  // Comments
  const getCommentsByTaskId = useCallback((taskId: string) => 
    storage.getCommentsByTaskId(taskId), [storage, refreshTrigger])

  const createComment = useCallback((comment: any) => {
    const newComment = storage.createComment(comment)
    refresh()
    return newComment
  }, [storage, refresh])

  // Activities
  const getActivities = useCallback((limit?: number) => 
    storage.getActivities(limit), [storage, refreshTrigger])

  // User
  const user = storage.getUser()
  const updateUser = useCallback((updates: any) => {
    const updatedUser = storage.updateUser(updates)
    refresh()
    return updatedUser
  }, [storage, refresh])

  // Utilities
  const exportData = useCallback(() => storage.exportData(), [storage])
  const importData = useCallback((jsonData: string) => {
    const success = storage.importData(jsonData)
    if (success) refresh()
    return success
  }, [storage, refresh])

  const resetData = useCallback(() => {
    storage.resetData()
    refresh()
  }, [storage, refresh])

  return {
    // Data
    boards,
    user,
    
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