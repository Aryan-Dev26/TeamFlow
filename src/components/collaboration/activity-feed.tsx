'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, CheckCircle, MessageSquare, Users, Clock, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RealtimeManager } from '@/lib/realtime'

interface Activity {
  id: string
  type: 'task_created' | 'task_completed' | 'comment_added' | 'user_joined' | 'task_moved'
  message: string
  user?: {
    name: string
    avatar?: string
    initials: string
  }
  timestamp: string
  priority?: 'low' | 'medium' | 'high'
}

const activityIcons = {
  task_created: CheckCircle,
  task_completed: CheckCircle,
  comment_added: MessageSquare,
  user_joined: Users,
  task_moved: Zap
}

const activityColors = {
  task_created: 'text-blue-500',
  task_completed: 'text-green-500',
  comment_added: 'text-purple-500',
  user_joined: 'text-orange-500',
  task_moved: 'text-yellow-500'
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'task_completed',
      message: 'completed "User Authentication System"',
      user: { name: 'Sarah Chen', initials: 'SC' },
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      priority: 'high'
    },
    {
      id: '2',
      type: 'comment_added',
      message: 'commented on "Mobile App Design"',
      user: { name: 'Mike Johnson', initials: 'MJ' },
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'task_created',
      message: 'created new task "API Documentation"',
      user: { name: 'Alex Kim', initials: 'AK' },
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      type: 'user_joined',
      message: 'joined the project',
      user: { name: 'Emma Wilson', initials: 'EW' },
      timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
    }
  ])

  useEffect(() => {
    const realtime = RealtimeManager.getInstance()

    const handleActivity = (data: any) => {
      const newActivity: Activity = {
        id: Date.now().toString(),
        type: 'task_moved',
        message: data.message,
        user: {
          name: 'Team Member',
          initials: 'TM'
        },
        timestamp: data.timestamp
      }

      setActivities(prev => [newActivity, ...prev.slice(0, 9)]) // Keep only 10 activities
    }

    realtime.on('activity', handleActivity)
    realtime.simulateActivity()

    return () => {
      realtime.off('activity', handleActivity)
    }
  }, [])

  const formatTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Live Activity
          </h3>
          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse" />
            Live
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type]
              const colorClass = activityColors[activity.type]

              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={`p-1.5 rounded-full bg-white dark:bg-gray-700 ${colorClass}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {activity.user && (
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={activity.user.avatar} />
                          <AvatarFallback className="text-xs">
                            {activity.user.initials}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          <span className="font-medium">{activity.user?.name}</span>{' '}
                          <span className="text-gray-600 dark:text-gray-400">
                            {activity.message}
                          </span>
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(activity.timestamp)}
                          </span>
                          {activity.priority && (
                            <Badge 
                              variant={activity.priority === 'high' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {activity.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}