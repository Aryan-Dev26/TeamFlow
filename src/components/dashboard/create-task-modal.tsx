'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, User, Flag, Tag, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTeamFlowData } from '@/hooks/use-teamflow-data'

interface CreateTaskModalProps {
  isOpen: boolean
  onClose: () => void
  columns: Array<{
    id: string
    title: string
    color: string
  }>
  onTaskCreated?: (task: any) => void
}

const teamMembers = [
  { id: '1', name: 'Sarah Chen', initials: 'SC', avatar: '/avatars/sarah.jpg', role: 'Designer' },
  { id: '2', name: 'Mike Johnson', initials: 'MJ', avatar: '/avatars/mike.jpg', role: 'Developer' },
  { id: '3', name: 'Alex Kim', initials: 'AK', avatar: '/avatars/alex.jpg', role: 'Backend Dev' },
  { id: '4', name: 'Emma Wilson', initials: 'EW', avatar: '/avatars/emma.jpg', role: 'Product Manager' },
  { id: '5', name: 'John Doe', initials: 'JD', avatar: '/avatars/john.jpg', role: 'Full Stack' }
]

const priorityOptions = [
  { value: 'Low', label: 'Low Priority', color: 'bg-green-100 text-green-800', icon: '🟢' },
  { value: 'Medium', label: 'Medium Priority', color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
  { value: 'High', label: 'High Priority', color: 'bg-red-100 text-red-800', icon: '🔴' },
]

const tagSuggestions = [
  'Frontend', 'Backend', 'Design', 'Research', 'Testing', 'Documentation', 
  'Bug Fix', 'Feature', 'Improvement', 'Security', 'Performance', 'Mobile'
]

export function CreateTaskModal({ isOpen, onClose, columns, onTaskCreated }: CreateTaskModalProps) {
  const { createTask } = useTeamFlowData()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignee: '',
    column: 'todo',
    dueDate: '',
    tags: [] as string[]
  })
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Find assignee details
      const assigneeDetails = formData.assignee 
        ? teamMembers.find(member => member.id === formData.assignee)
        : null

      // Create task object
      const newTaskData = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        columnId: formData.column,
        assignee: assigneeDetails ? {
          name: assigneeDetails.name,
          initials: assigneeDetails.initials,
          avatar: assigneeDetails.avatar
        } : null,
        dueDate: formData.dueDate,
        tags: formData.tags
      }

      // Create the task using the storage system
      const createdTask = createTask(newTaskData)
      
      // Call the callback if provided
      if (onTaskCreated) {
        onTaskCreated(createdTask)
      }
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'Medium',
        assignee: '',
        column: 'todo',
        dueDate: '',
        tags: []
      })
      setTagInput('')
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
    setTagInput('')
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput.trim())
    }
  }

  if (!isOpen) return null

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
          className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          <Card className="shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold">Create New Task</CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Task Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter task title..."
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    required
                    className="text-lg"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the task in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* Row 1: Priority and Column */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <span>{option.icon}</span>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Column</Label>
                    <Select
                      value={formData.column}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, column: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.map((column) => (
                          <SelectItem key={column.id} value={column.id}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${column.color}`} />
                              <span>{column.title}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 2: Assignee and Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Assignee</Label>
                    <Select
                      value={formData.assignee}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assignee: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assignee..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="text-xs">{member.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-xs text-gray-500">{member.role}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="space-y-3">
                    {/* Current Tags */}
                    {formData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100 hover:text-red-800"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Tag Input */}
                    <Input
                      placeholder="Add tags (press Enter)..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />

                    {/* Tag Suggestions */}
                    <div className="flex flex-wrap gap-2">
                      {tagSuggestions
                        .filter(tag => !formData.tags.includes(tag))
                        .slice(0, 6)
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => addTag(tag)}
                          >
                            + {tag}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Paperclip className="h-4 w-4" />
                    <span>Attachments can be added after creation</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={!formData.title || isSubmitting}>
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="spinner" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        'Create Task'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}