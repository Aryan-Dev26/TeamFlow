'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  MoreHorizontal, 
  Users, 
  Calendar,
  MessageSquare,
  Paperclip,
  Flag,
  Eye,
  Filter,
  Search,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { TaskCard } from '@/components/dashboard/task-card'
import { CreateTaskModal } from '@/components/dashboard/create-task-modal'
import { TaskDetailModal } from '@/components/dashboard/task-detail-modal'
import { cn } from '@/lib/utils'

// Mock data for the board
const initialColumns = [
  {
    id: 'todo',
    title: 'To Do',
    color: 'bg-gray-500',
    tasks: [
      {
        id: 'task-1',
        title: 'Design new landing page',
        description: 'Create a modern, responsive landing page for the new product launch',
        priority: 'High',
        assignee: { name: 'Sarah Chen', initials: 'SC', avatar: '/avatars/sarah.jpg' },
        dueDate: '2024-01-15',
        tags: ['Design', 'Frontend'],
        comments: 3,
        attachments: 2
      },
      {
        id: 'task-2',
        title: 'User research interviews',
        description: 'Conduct 10 user interviews to validate product assumptions',
        priority: 'Medium',
        assignee: { name: 'Mike Johnson', initials: 'MJ', avatar: '/avatars/mike.jpg' },
        dueDate: '2024-01-18',
        tags: ['Research', 'UX'],
        comments: 1,
        attachments: 0
      }
    ]
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    color: 'bg-blue-500',
    tasks: [
      {
        id: 'task-3',
        title: 'Implement authentication system',
        description: 'Build secure login/signup with JWT tokens and OAuth integration',
        priority: 'High',
        assignee: { name: 'Alex Kim', initials: 'AK', avatar: '/avatars/alex.jpg' },
        dueDate: '2024-01-16',
        tags: ['Backend', 'Security'],
        comments: 5,
        attachments: 1
      },
      {
        id: 'task-4',
        title: 'Mobile app wireframes',
        description: 'Create detailed wireframes for iOS and Android applications',
        priority: 'Medium',
        assignee: { name: 'Emma Wilson', initials: 'EW', avatar: '/avatars/emma.jpg' },
        dueDate: '2024-01-20',
        tags: ['Design', 'Mobile'],
        comments: 2,
        attachments: 3
      }
    ]
  },
  {
    id: 'review',
    title: 'Review',
    color: 'bg-purple-500',
    tasks: [
      {
        id: 'task-5',
        title: 'API documentation',
        description: 'Complete REST API documentation with examples and schemas',
        priority: 'Low',
        assignee: { name: 'John Doe', initials: 'JD', avatar: '/avatars/john.jpg' },
        dueDate: '2024-01-22',
        tags: ['Documentation', 'API'],
        comments: 1,
        attachments: 0
      }
    ]
  },
  {
    id: 'done',
    title: 'Done',
    color: 'bg-green-500',
    tasks: [
      {
        id: 'task-6',
        title: 'Database schema design',
        description: 'Design and implement the core database schema for user management',
        priority: 'High',
        assignee: { name: 'Sarah Chen', initials: 'SC', avatar: '/avatars/sarah.jpg' },
        dueDate: '2024-01-10',
        tags: ['Database', 'Backend'],
        comments: 4,
        attachments: 2
      },
      {
        id: 'task-7',
        title: 'Brand guidelines',
        description: 'Establish comprehensive brand guidelines including colors, typography, and logos',
        priority: 'Medium',
        assignee: { name: 'Emma Wilson', initials: 'EW', avatar: '/avatars/emma.jpg' },
        dueDate: '2024-01-12',
        tags: ['Branding', 'Design'],
        comments: 2,
        attachments: 5
      }
    ]
  }
]

const teamMembers = [
  { name: 'Sarah Chen', initials: 'SC', avatar: '/avatars/sarah.jpg', online: true },
  { name: 'Mike Johnson', initials: 'MJ', avatar: '/avatars/mike.jpg', online: true },
  { name: 'Alex Kim', initials: 'AK', avatar: '/avatars/alex.jpg', online: false },
  { name: 'Emma Wilson', initials: 'EW', avatar: '/avatars/emma.jpg', online: true },
  { name: 'John Doe', initials: 'JD', avatar: '/avatars/john.jpg', online: true }
]

export default function BoardPage({ params }: { params: { id: string } }) {
  const [columns, setColumns] = useState(initialColumns)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  const [activeUsers, setActiveUsers] = useState(teamMembers.filter(m => m.online))

  // Simulate real-time user activity
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const shuffled = [...teamMembers].sort(() => Math.random() - 0.5)
        return shuffled.slice(0, Math.floor(Math.random() * 3) + 2)
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    const sourceTask = sourceColumn.tasks.find(task => task.id === draggableId)
    if (!sourceTask) return

    // Remove task from source column
    const newSourceTasks = sourceColumn.tasks.filter(task => task.id !== draggableId)
    
    // Add task to destination column
    const newDestTasks = [...destColumn.tasks]
    newDestTasks.splice(destination.index, 0, sourceTask)

    // Update columns
    const newColumns = columns.map(col => {
      if (col.id === source.droppableId) {
        return { ...col, tasks: newSourceTasks }
      }
      if (col.id === destination.droppableId) {
        return { ...col, tasks: newDestTasks }
      }
      return col
    })

    setColumns(newColumns)

    // Simulate real-time update notification
    setTimeout(() => {
      // This would normally be a socket event
      console.log(`Task "${sourceTask.title}" moved to ${destColumn.title}`)
    }, 100)
  }

  const handleTaskClick = (task: any) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  const filteredColumns = columns.map(column => ({
    ...column,
    tasks: column.tasks.filter(task =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }))

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Board Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Website Redesign
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Design and development of the new company website
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
              Active Sprint
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            {/* Team Members */}
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {activeUsers.slice(0, 4).map((member, index) => (
                  <motion.div
                    key={member.name}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Avatar className="h-8 w-8 border-2 border-white dark:border-gray-800 relative">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                      {member.online && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full" />
                      )}
                    </Avatar>
                  </motion.div>
                ))}
                {activeUsers.length > 4 && (
                  <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                      +{activeUsers.length - 4}
                    </span>
                  </div>
                )}
              </div>
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Invite
              </Button>
            </div>

            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex space-x-6 min-w-max">
            {filteredColumns.map((column, columnIndex) => (
              <motion.div
                key={column.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: columnIndex * 0.1 }}
                className="w-80 flex-shrink-0"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  {/* Column Header */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={cn('w-3 h-3 rounded-full', column.color)} />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {column.title}
                        </h3>
                        <Badge variant="secondary" className="text-xs">
                          {column.tasks.length}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Tasks */}
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'p-4 space-y-3 min-h-[200px] transition-colors',
                          snapshot.isDraggingOver && 'bg-blue-50 dark:bg-blue-900/20'
                        )}
                      >
                        <AnimatePresence>
                          {column.tasks.map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided, snapshot) => (
                                <motion.div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.2 }}
                                  className={cn(
                                    'transform transition-transform',
                                    snapshot.isDragging && 'rotate-3 scale-105 shadow-lg'
                                  )}
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <TaskCard task={task} />
                                </motion.div>
                              )}
                            </Draggable>
                          ))}
                        </AnimatePresence>
                        {provided.placeholder}

                        {/* Add Task Button */}
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          onClick={() => setIsCreateModalOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add a task
                        </Button>
                      </div>
                    )}
                  </Droppable>
                </div>
              </motion.div>
            ))}

            {/* Add Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="w-80 flex-shrink-0"
            >
              <Button
                variant="outline"
                className="w-full h-32 border-dashed border-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Plus className="h-6 w-6 mr-2" />
                Add another list
              </Button>
            </motion.div>
          </div>
        </DragDropContext>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        columns={columns}
      />

      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => setIsTaskDetailOpen(false)}
        task={selectedTask}
      />
    </div>
  )
}