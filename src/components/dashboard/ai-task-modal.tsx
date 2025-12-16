'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Sparkles, Brain, Zap, Target, Clock, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { aiAssistant } from '@/lib/ai-assistant'

interface AITaskModalProps {
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

export function AITaskModal({ isOpen, onClose, columns, onTaskCreated }: AITaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    assignee: '',
    column: 'todo',
    dueDate: '',
    tags: [] as string[]
  })
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Generate AI suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      generateAISuggestions()
    }
  }, [isOpen])

  // Analyze task when title or description changes
  useEffect(() => {
    if (formData.title || formData.description) {
      analyzeTask()
    }
  }, [formData.title, formData.description])

  const generateAISuggestions = async () => {
    setIsGeneratingSuggestions(true)
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const suggestions = aiAssistant.generateTaskSuggestions({
      projectType: 'Website Development',
      teamSize: 5,
      deadline: '2024-12-31',
      existingTasks: []
    })
    
    setAiSuggestions(suggestions)
    setIsGeneratingSuggestions(false)
  }

  const analyzeTask = async () => {
    if (!formData.title && !formData.description) return

    const analysis = aiAssistant.suggestTaskPriority({
      title: formData.title,
      description: formData.description,
      tags: formData.tags,
      dueDate: formData.dueDate
    })

    setAiAnalysis(analysis)
  }

  const applySuggestion = (suggestion: any) => {
    setFormData(prev => ({
      ...prev,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      tags: suggestion.tags,
      assignee: teamMembers.find(m => m.role.includes(suggestion.assigneeSuggestion?.split(' ')[0]))?.id || ''
    }))
  }

  const applyAIAnalysis = () => {
    if (aiAnalysis) {
      setFormData(prev => ({
        ...prev,
        priority: aiAnalysis.suggestedPriority
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise(resolve => setTimeout(resolve, 1000))

    const assigneeDetails = formData.assignee 
      ? teamMembers.find(member => member.id === formData.assignee)
      : null

    const newTask = {
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

    if (onTaskCreated) {
      onTaskCreated(newTask)
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
    setAiSuggestions([])
    setAiAnalysis(null)
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      AI-Powered Task Creation
                      <Sparkles className="h-4 w-4 text-yellow-500" />
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
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

                    {/* AI Analysis */}
                    {aiAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-purple-900 dark:text-purple-100 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            AI Analysis
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {aiAnalysis.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                          Suggested Priority: <strong>{aiAnalysis.suggestedPriority}</strong>
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mb-3">
                          {aiAnalysis.reasoning}
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={applyAIAnalysis}
                          className="text-xs"
                        >
                          Apply Suggestion
                        </Button>
                      </motion.div>
                    )}

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
                            <SelectItem value="Low">🟢 Low Priority</SelectItem>
                            <SelectItem value="Medium">🟡 Medium Priority</SelectItem>
                            <SelectItem value="High">🔴 High Priority</SelectItem>
                            <SelectItem value="Urgent">🚨 Urgent</SelectItem>
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

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        AI-powered suggestions available →
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
            </div>

            {/* AI Suggestions Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    AI Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isGeneratingSuggestions ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {aiSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => applySuggestion(suggestion)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{suggestion.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {suggestion.description}
                          </p>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {suggestion.estimatedHours}h
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {suggestion.assigneeSuggestion}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {suggestion.tags.slice(0, 2).map((tag: string) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Smart Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    💡 <strong>Pro Tip:</strong> Include specific keywords like "urgent", "bug", or "security" for better AI priority suggestions.
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    🎯 <strong>Best Practice:</strong> Add detailed descriptions to get more accurate time estimates and assignee suggestions.
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    ⚡ <strong>Quick Start:</strong> Click any AI suggestion to auto-fill the form with optimized values.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}