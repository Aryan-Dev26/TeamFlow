'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Bot, 
  Send, 
  Sparkles, 
  MessageSquare, 
  X, 
  Minimize2,
  Maximize2,
  Lightbulb,
  TrendingUp,
  Target,
  Users,
  Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { aiAssistant } from '@/lib/ai-assistant'
import { useTeamFlowData } from '@/hooks/use-teamflow-data'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  actions?: any[]
  data?: any
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
  onMinimize?: () => void
  isMinimized?: boolean
}

const quickActions = [
  { icon: TrendingUp, label: 'Show productivity', query: 'How is my team performing?' },
  { icon: Target, label: 'Project status', query: 'What is the status of my project?' },
  { icon: Users, label: 'Team workload', query: 'How is the team workload distributed?' },
  { icon: Lightbulb, label: 'Get suggestions', query: 'Give me suggestions to improve productivity' }
]

export function AIChat({ isOpen, onClose, onMinimize, isMinimized }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "👋 Hi! I'm your AI assistant for TeamFlow. I can help you with task management, team analytics, productivity insights, and project planning. What would you like to know?",
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { boards, getTasksByColumnId, getActivities } = useTeamFlowData()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

    // Get context data
    const allTasks: any[] = []
    boards.forEach(board => {
      ['todo', 'in-progress', 'review', 'done'].forEach(columnId => {
        const columnTasks = getTasksByColumnId(columnId)
        allTasks.push(...columnTasks)
      })
    })

    const context = {
      tasks: allTasks,
      activities: getActivities(20),
      boards
    }

    // Process with AI assistant
    const aiResponse = aiAssistant.processNaturalLanguageQuery(message, context)

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'ai',
      content: aiResponse.response,
      timestamp: new Date(),
      actions: aiResponse.actions,
      data: aiResponse.data
    }

    setMessages(prev => [...prev, aiMessage])
    setIsTyping(false)
  }

  const handleQuickAction = (query: string) => {
    handleSendMessage(query)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(inputValue)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0,
          height: isMinimized ? 60 : 600
        }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-20 right-4 md:bottom-4 md:right-4 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-40 overflow-hidden max-h-[70vh] md:max-h-[80vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar className="h-8 w-8 bg-white/20">
                  <AvatarFallback className="bg-transparent text-white">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  AI Assistant
                  <Sparkles className="h-4 w-4" />
                </h3>
                <p className="text-xs text-white/80">
                  {isTyping ? 'Thinking...' : 'Online'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {onMinimize && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMinimize}
                  className="text-white hover:bg-white/20 h-8 w-8 p-0"
                >
                  {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-r-lg rounded-tl-lg'
                  } p-3`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    
                    {/* Action buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs"
                            onClick={() => {
                              // Handle action clicks
                              console.log('Action clicked:', action)
                            }}
                          >
                            {action.type === 'open_create_task_modal' && (
                              <>
                                <Target className="h-3 w-3 mr-2" />
                                Create New Task
                              </>
                            )}
                            {action.type === 'show_analytics' && (
                              <>
                                <TrendingUp className="h-3 w-3 mr-2" />
                                View Analytics
                              </>
                            )}
                            {action.type === 'show_overdue_tasks' && (
                              <>
                                <Zap className="h-3 w-3 mr-2" />
                                Show Overdue Tasks
                              </>
                            )}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Data visualization */}
                    {message.data && (
                      <div className="mt-3 p-2 bg-white/10 rounded text-xs">
                        {message.data.completed !== undefined && (
                          <div className="flex justify-between">
                            <span>Completed:</span>
                            <span className="font-semibold">{message.data.completed}/{message.data.total}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-r-lg rounded-tl-lg p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Actions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick actions:</p>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start text-xs h-8"
                      onClick={() => handleQuickAction(action.query)}
                    >
                      <action.icon className="h-3 w-3 mr-2" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask me anything about your project..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isTyping}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSendMessage(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}