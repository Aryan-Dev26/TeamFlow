'use client'

import { motion } from 'framer-motion'
import { 
  Calendar, 
  MessageSquare, 
  Paperclip, 
  Flag,
  Clock,
  User
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: {
    id: string
    title: string
    description: string
    priority: string
    assignee: {
      name: string
      initials: string
      avatar: string
    }
    dueDate: string
    tags: string[]
    comments: number
    attachments: number
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400'
    case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
    case 'Low': return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800 dark:text-gray-400'
  }
}

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'High': return '🔴'
    case 'Medium': return '🟡'
    case 'Low': return '🟢'
    default: return '⚪'
  }
}

const isOverdue = (dueDate: string) => {
  return new Date(dueDate) < new Date()
}

const getDaysUntilDue = (dueDate: string) => {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

export function TaskCard({ task }: TaskCardProps) {
  const daysUntilDue = getDaysUntilDue(task.dueDate)
  const overdue = isOverdue(task.dueDate)

  return (
    <Card className="cursor-pointer hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4 space-y-3">
        {/* Priority and Tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm">{getPriorityIcon(task.priority)}</span>
            <Badge variant="secondary" className={cn('text-xs', getPriorityColor(task.priority))}>
              {task.priority}
            </Badge>
          </div>
          {task.tags.length > 0 && (
            <div className="flex space-x-1">
              {task.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Task Title */}
        <h4 className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {task.title}
        </h4>

        {/* Task Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {task.description}
        </p>

        {/* Due Date */}
        <div className="flex items-center space-x-2">
          <Calendar className="h-3 w-3 text-gray-400" />
          <span className={cn(
            'text-xs',
            overdue 
              ? 'text-red-600 dark:text-red-400 font-medium' 
              : daysUntilDue <= 2 
                ? 'text-yellow-600 dark:text-yellow-400 font-medium'
                : 'text-gray-500 dark:text-gray-400'
          )}>
            {overdue 
              ? `Overdue by ${Math.abs(daysUntilDue)} days`
              : daysUntilDue === 0 
                ? 'Due today'
                : daysUntilDue === 1
                  ? 'Due tomorrow'
                  : `Due in ${daysUntilDue} days`
            }
          </span>
        </div>

        {/* Bottom Section */}
        <div className="flex items-center justify-between pt-2">
          {/* Assignee */}
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar} />
              <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {task.assignee.name}
            </span>
          </div>

          {/* Engagement Metrics */}
          <div className="flex items-center space-x-3">
            {task.comments > 0 && (
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {task.comments}
                </span>
              </div>
            )}
            {task.attachments > 0 && (
              <div className="flex items-center space-x-1">
                <Paperclip className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {task.attachments}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Progress Indicator (if task is in progress) */}
        {task.id.includes('progress') && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">65%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <motion.div
                className="bg-blue-500 h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Hover Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 rounded-lg transition-all duration-300 pointer-events-none" />
      </CardContent>
    </Card>
  )
}