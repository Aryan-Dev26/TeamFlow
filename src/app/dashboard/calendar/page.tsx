'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Filter,
  Eye,
  Edit3,
  Trash2,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useTeamFlowData } from '@/hooks/use-teamflow-data'
import { CreateTaskModal } from '@/components/dashboard/create-task-modal'
import { TaskDetailModal } from '@/components/dashboard/task-detail-modal'
import { cn } from '@/lib/utils'

type ViewType = 'month' | 'week' | 'day'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function CalendarPage() {
  const { boards, getTasksByColumnId } = useTeamFlowData()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('month')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Get all tasks with due dates
  const tasksWithDates = useMemo(() => {
    const tasks: any[] = []
    boards.forEach(board => {
      ['todo', 'in-progress', 'review', 'done'].forEach(columnId => {
        const columnTasks = getTasksByColumnId(columnId)
        tasks.push(...columnTasks
          .filter(task => task.dueDate)
          .map(task => ({
            ...task,
            boardName: board.name,
            status: columnId,
            date: new Date(task.dueDate)
          }))
        )
      })
    })
    return tasks
  }, [boards, getTasksByColumnId])

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      const dayTasks = tasksWithDates.filter(task => 
        task.date.toDateString() === current.toDateString()
      )
      
      days.push({
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        tasks: dayTasks
      })
      
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }, [currentDate, tasksWithDates])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500'
      case 'High': return 'bg-orange-500'
      case 'Medium': return 'bg-yellow-500'
      case 'Low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'border-l-gray-500'
      case 'in-progress': return 'border-l-blue-500'
      case 'review': return 'border-l-purple-500'
      case 'done': return 'border-l-green-500'
      default: return 'border-l-gray-500'
    }
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsCreateModalOpen(true)
  }

  const upcomingTasks = tasksWithDates
    .filter(task => task.date >= new Date() && task.status !== 'done')
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  const overdueTasks = tasksWithDates
    .filter(task => task.date < new Date() && task.status !== 'done')
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your tasks by date
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={view} onValueChange={(value: ViewType) => setView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5" />
                  <span>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {DAYS.map(day => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {calendarDays.map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.1, delay: index * 0.01 }}
                    className={cn(
                      'min-h-[100px] p-2 border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                      !day.isCurrentMonth && 'bg-gray-50 dark:bg-gray-800/50 text-gray-400',
                      day.isToday && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    )}
                    onClick={() => handleDateClick(day.date)}
                  >
                    <div className={cn(
                      'text-sm font-medium mb-1',
                      day.isToday && 'text-blue-600 dark:text-blue-400'
                    )}>
                      {day.date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {day.tasks.slice(0, 3).map((task, taskIndex) => (
                        <div
                          key={task.id}
                          className={cn(
                            'text-xs p-1 rounded border-l-2 bg-white dark:bg-gray-700 cursor-pointer hover:shadow-sm transition-shadow',
                            getStatusColor(task.status)
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTaskClick(task)
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            <div className={cn('w-2 h-2 rounded-full', getPriorityColor(task.priority))} />
                            <span className="truncate flex-1">{task.title}</span>
                          </div>
                        </div>
                      ))}
                      
                      {day.tasks.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          +{day.tasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Tasks</CardTitle>
              <CardDescription>Tasks due in the next few days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    No upcoming tasks
                  </p>
                ) : (
                  upcomingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm truncate">{task.title}</h4>
                        <Badge className={getPriorityColor(task.priority) + ' text-white text-xs'}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                        <CalendarIcon className="h-3 w-3" />
                        <span>{task.date.toLocaleDateString()}</span>
                        {task.assignee && (
                          <>
                            <span>•</span>
                            <span>{task.assignee.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          {overdueTasks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Overdue Tasks</CardTitle>
                <CardDescription>Tasks that are past their due date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdueTasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="p-3 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer transition-colors"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm truncate text-red-900 dark:text-red-100">
                          {task.title}
                        </h4>
                        <Badge variant="destructive" className="text-xs">
                          Overdue
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-red-700 dark:text-red-300">
                        <Clock className="h-3 w-3" />
                        <span>Due {task.date.toLocaleDateString()}</span>
                        {task.assignee && (
                          <>
                            <span>•</span>
                            <span>{task.assignee.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</span>
                  <span className="font-semibold">{tasksWithDates.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Completed</span>
                  <span className="font-semibold text-green-600">
                    {tasksWithDates.filter(t => t.status === 'done').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">In Progress</span>
                  <span className="font-semibold text-blue-600">
                    {tasksWithDates.filter(t => t.status === 'in-progress').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overdue</span>
                  <span className="font-semibold text-red-600">{overdueTasks.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columns={[
          { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
          { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500' },
          { id: 'review', title: 'Review', color: 'bg-purple-500' },
          { id: 'done', title: 'Done', color: 'bg-green-500' }
        ]}
      />

      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => setIsTaskDetailOpen(false)}
        task={selectedTask}
      />
    </div>
  )
}