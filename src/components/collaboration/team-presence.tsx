'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Circle, Eye, Edit3 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { RealtimeManager, RealtimeUser } from '@/lib/realtime'

interface TeamMember extends RealtimeUser {
  status: 'online' | 'away' | 'busy' | 'offline'
  currentActivity?: string
}

export function TeamPresence() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Chen',
      initials: 'SC',
      status: 'online',
      currentActivity: 'Editing task "Homepage Design"',
      activeTask: 'task-1',
      lastSeen: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Mike Johnson',
      initials: 'MJ',
      status: 'busy',
      currentActivity: 'In meeting',
      lastSeen: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Alex Kim',
      initials: 'AK',
      status: 'online',
      currentActivity: 'Reviewing code',
      activeTask: 'task-3',
      lastSeen: new Date().toISOString()
    },
    {
      id: '4',
      name: 'Emma Wilson',
      initials: 'EW',
      status: 'away',
      currentActivity: 'Away',
      lastSeen: new Date(Date.now() - 15 * 60 * 1000).toISOString()
    },
    {
      id: '5',
      name: 'John Doe',
      initials: 'JD',
      status: 'offline',
      lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    }
  ])

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
    offline: 'bg-gray-400'
  }

  const statusIcons = {
    online: Circle,
    away: Circle,
    busy: Circle,
    offline: Circle
  }

  useEffect(() => {
    // Simulate real-time status updates
    const interval = setInterval(() => {
      setTeamMembers(prev => prev.map(member => {
        if (Math.random() > 0.8) { // 20% chance to update
          const activities = [
            'Editing task "Mobile App"',
            'Reviewing pull request',
            'In video call',
            'Writing documentation',
            'Testing features'
          ]
          return {
            ...member,
            currentActivity: member.status === 'online' ? 
              activities[Math.floor(Math.random() * activities.length)] : 
              member.currentActivity,
            lastSeen: new Date().toISOString()
          }
        }
        return member
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const formatLastSeen = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diff = now.getTime() - time.getTime()
    
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (minutes < 1) return 'Active now'
    if (minutes < 60) return `${minutes}m ago`
    return `${hours}h ago`
  }

  const onlineCount = teamMembers.filter(m => m.status === 'online').length
  const totalCount = teamMembers.length

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Team Presence
          </h3>
          <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {onlineCount}/{totalCount} online
          </Badge>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="text-sm">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${statusColors[member.status]}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {member.name}
                    </p>
                    {member.status === 'online' && member.currentActivity?.includes('Editing') && (
                      <Edit3 className="h-3 w-3 text-blue-500" />
                    )}
                    {member.activeTask && (
                      <Eye className="h-3 w-3 text-green-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {member.currentActivity || formatLastSeen(member.lastSeen)}
                  </p>
                </div>

                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    member.status === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    member.status === 'busy' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    member.status === 'away' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {member.status}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Quick actions */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Team collaboration active</span>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Live updates</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}