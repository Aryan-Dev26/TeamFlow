'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Calendar, 
  User, 
  Flag, 
  Tag, 
  Paperclip, 
  MessageSquare,
  Clock,
  Edit,
  Trash2,
  Share,
  Eye,
  Plus,
  Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface TaskDetailModalProps {
  isOpen: boolean
  onClose: () => void
  task: any
}

const mockComments = [
  {
    id: 1,
    author: { name: 'Sarah Chen', initials: 'SC', avatar: '/avatars/sarah.jpg' },
    content: 'I\'ve started working on the wireframes. Should have the first draft ready by tomorrow.',
    timestamp: '2 hours ago',
    reactions: ['👍', '🎉']
  },
  {
    id: 2,
    author: { name: 'Mike Johnson', initials: 'MJ', avatar: '/avatars/mike.jpg' },
    content: 'Great! Make sure to consider the mobile-first approach we discussed.',
    timestamp: '1 hour ago',
    reactions: ['👍']
  },
  {
    id: 3,
    author: { name: 'Alex Kim', initials: 'AK', avatar: '/avatars/alex.jpg' },
    content: 'I can help with the technical feasibility review once the wireframes are ready.',
    timestamp: '30 minutes ago',
    reactions: []
  }
]

const mockAttachments = [
  { id: 1, name: 'wireframe-v1.fig', size: '2.4 MB', type: 'figma' },
  { id: 2, name: 'requirements.pdf', size: '1.2 MB', type: 'pdf' },
  { id: 3, name: 'user-research.xlsx', size: '856 KB', type: 'excel' }
]

const mockActivity = [
  { id: 1, action: 'Task created', user: 'Sarah Chen', timestamp: '3 days ago' },
  { id: 2, action: 'Priority changed to High', user: 'Mike Johnson', timestamp: '2 days ago' },
  { id: 3, action: 'Due date updated', user: 'Sarah Chen', timestamp: '1 day ago' },
  { id: 4, action: 'Comment added', user: 'Alex Kim', timestamp: '30 minutes ago' }
]

export function TaskDetailModal({ isOpen, onClose, task }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [newComment, setNewComment] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  if (!isOpen || !task) return null

  const handleAddComment = () => {
    if (newComment.trim()) {
      console.log('Adding comment:', newComment)
      setNewComment('')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-50 dark:bg-red-900/20'
      case 'Medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
      case 'Low': return 'text-green-600 bg-green-50 dark:bg-green-900/20'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800'
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
        >
          <Card className="shadow-2xl h-full flex flex-col">
            {/* Header */}
            <CardHeader className="pb-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority} Priority
                    </Badge>
                    {task.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="text-2xl font-semibold mb-2">
                    {task.title}
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400">
                    {task.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Share className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 mt-4">
                {['overview', 'comments', 'activity'].map((tab) => (
                  <Button
                    key={tab}
                    variant={activeTab === tab ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab)}
                    className="capitalize"
                  >
                    {tab}
                    {tab === 'comments' && (
                      <Badge variant="secondary" className="ml-2">
                        {mockComments.length}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </CardHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-6 p-6">
                {/* Main Content */}
                <div className="col-span-2 space-y-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm font-medium">Progress</Label>
                          <span className="text-sm text-gray-500">65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>

                      {/* Attachments */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Attachments</Label>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add File
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {mockAttachments.map((file) => (
                            <div
                              key={file.id}
                              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                              <div className="flex items-center space-x-3">
                                <Paperclip className="h-4 w-4 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium">{file.name}</p>
                                  <p className="text-xs text-gray-500">{file.size}</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm">
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Subtasks */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-sm font-medium">Subtasks</Label>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subtask
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {['Create wireframes', 'Review with team', 'Implement feedback'].map((subtask, index) => (
                            <div key={index} className="flex items-center space-x-3 p-2">
                              <input
                                type="checkbox"
                                checked={index === 0}
                                className="rounded"
                                readOnly
                              />
                              <span className={cn(
                                'text-sm',
                                index === 0 && 'line-through text-gray-500'
                              )}>
                                {subtask}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'comments' && (
                    <div className="space-y-4">
                      {/* Add Comment */}
                      <div className="flex space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                          />
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              onClick={handleAddComment}
                              disabled={!newComment.trim()}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Comment
                            </Button>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      {/* Comments List */}
                      <div className="space-y-4">
                        {mockComments.map((comment) => (
                          <div key={comment.id} className="flex space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={comment.author.avatar} />
                              <AvatarFallback>{comment.author.initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-sm">
                                    {comment.author.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {comment.timestamp}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {comment.content}
                                </p>
                              </div>
                              {comment.reactions.length > 0 && (
                                <div className="flex space-x-1 mt-2">
                                  {comment.reactions.map((reaction, index) => (
                                    <span key={index} className="text-sm">
                                      {reaction}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'activity' && (
                    <div className="space-y-4">
                      {mockActivity.map((activity) => (
                        <div key={activity.id} className="flex items-center space-x-3 p-3 border-l-2 border-blue-200 dark:border-blue-800">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm">
                              <span className="font-medium">{activity.user}</span>{' '}
                              {activity.action}
                            </p>
                            <p className="text-xs text-gray-500">{activity.timestamp}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Task Details */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Task Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-xs text-gray-500">Assignee</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={task.assignee.avatar} />
                            <AvatarFallback className="text-xs">
                              {task.assignee.initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{task.assignee.name}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500">Due Date</Label>
                        <div className="flex items-center space-x-2 mt-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{task.dueDate}</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500">Priority</Label>
                        <Badge className={cn('mt-1', getPriorityColor(task.priority))}>
                          {task.priority}
                        </Badge>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-500">Status</Label>
                        <Badge variant="secondary" className="mt-1">
                          In Progress
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Task
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Reassign
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Change Due Date
                      </Button>
                      <Separator />
                      <Button variant="outline" size="sm" className="w-full justify-start text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Task
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}