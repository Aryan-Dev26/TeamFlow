'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MoreVertical, 
  Clock, 
  MessageSquare, 
  Paperclip, 
  Flag,
  CheckCircle,
  Circle,
  User
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface MobileTaskCardProps {
  task: {
    id: string
    title: string
    description?: string
    priority: 'Low' | 'Medium' | 'High'
    status: 'todo' | 'in-progress' | 'review' | 'done'
    assignee?: {
      name: string
      avatar?: string
      initials: string
    }
    dueDate?: string
    tags?: string[]
    comments?: number
    attachments?: number
    progress?: number
  }
  onStatusChange?: (taskId: string, newStatus: string) => void
  onTaskClick?: (taskId: string) => void
}

export function MobileTaskCard({ task, onStatusChange, onTaskClick }: MobileTaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(task.status === 'done')

  const priorityColors = {
    Low: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    High: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }

  const statusColors = {
    todo: 'bg-gray-100 text-gray-700',
    'in-progress': 'bg-blue-100 text-blue-700',
    review: 'bg-purple-100 text-purple-700',
    done: 'bg-green-100 text-green-700'
  }

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = isCompleted ? 'todo' : 'done'
    setIsCompleted(!isCompleted)
    onStatusChange?.(task.id, newStatus)
  }

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays < 0) return 'Overdue'
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays <= 7) return `${diffDays} days`
    return date.toLocaleDateString()
  }

  const isDueSoon = task.dueDate && new Date(task.dueDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <Card 
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md',
          isCompleted && 'opacity-75',
          isOverdue && 'border-red-200 dark:border-red-800'
        )}
        onClick={() => onTaskClick?.(task.id)}
      >
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-6 w-6 mt-0.5"
                onClick={handleToggleComplete}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </Button>
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  'font-medium text-gray-900 dark:text-white text-sm leading-tight',
                  isCompleted && 'line-through text-gray-500'
                )}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
            </div>

            <Button variant="ghost" size="sm" className="p-1 h-6 w-6 ml-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {task.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {task.progress !== undefined && task.progress > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Progress</span>
                <span>{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Assignee */}
              {task.assignee && (
                <div className="flex items-center space-x-1">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assignee.avatar} />
                    <AvatarFallback className="text-xs">
                      {task.assignee.initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                {task.comments && task.comments > 0 && (
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-3 w-3" />
                    <span>{task.comments}</span>
                  </div>
                )}
                {task.attachments && task.attachments > 0 && (
                  <div className="flex items-center space-x-1">
                    <Paperclip className="h-3 w-3" />
                    <span>{task.attachments}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Priority */}
              <Badge className={cn('text-xs px-2 py-0.5', priorityColors[task.priority])}>
                <Flag className="h-2.5 w-2.5 mr-1" />
                {task.priority}
              </Badge>

              {/* Due Date */}
              {task.dueDate && (
                <div className={cn(
                  'flex items-center space-x-1 text-xs px-2 py-1 rounded',
                  isOverdue 
                    ? 'text-red-600 bg-red-50 dark:bg-red-900/20' 
                    : isDueSoon 
                    ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'text-gray-600 bg-gray-50 dark:bg-gray-800'
                )}>
                  <Clock className="h-3 w-3" />
                  <span>{formatDueDate(task.dueDate)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}