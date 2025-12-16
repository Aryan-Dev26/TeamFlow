'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RealtimeManager, RealtimeUser } from '@/lib/realtime'

export function LiveCursors() {
  const [users, setUsers] = useState<RealtimeUser[]>([])
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const realtime = RealtimeManager.getInstance()

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      realtime.updateUserCursor(e.clientX, e.clientY)
    }

    const handleUserJoin = () => {
      setUsers(realtime.getActiveUsers())
    }

    const handleCursorMove = () => {
      setUsers(realtime.getActiveUsers())
    }

    document.addEventListener('mousemove', handleMouseMove)
    realtime.on('user_join', handleUserJoin)
    realtime.on('cursor_move', handleCursorMove)

    // Simulate other users for demo
    setTimeout(() => {
      const demoUsers: RealtimeUser[] = [
        {
          id: 'demo-1',
          name: 'Sarah Chen',
          initials: 'SC',
          cursor: { x: 300, y: 200 },
          activeTask: 'task-1',
          lastSeen: new Date().toISOString()
        },
        {
          id: 'demo-2',
          name: 'Mike Johnson',
          initials: 'MJ',
          cursor: { x: 600, y: 400 },
          activeTask: 'task-2',
          lastSeen: new Date().toISOString()
        }
      ]

      demoUsers.forEach(user => {
        realtime.setCurrentUser(user)
        // Animate cursors
        setInterval(() => {
          const newX = user.cursor!.x + (Math.random() - 0.5) * 100
          const newY = user.cursor!.y + (Math.random() - 0.5) * 100
          user.cursor = { 
            x: Math.max(0, Math.min(window.innerWidth - 50, newX)),
            y: Math.max(0, Math.min(window.innerHeight - 50, newY))
          }
          realtime.updateUserCursor(user.cursor.x, user.cursor.y)
        }, 3000)
      })
    }, 2000)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      realtime.off('user_join', handleUserJoin)
      realtime.off('cursor_move', handleCursorMove)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {users
          .filter(user => user.cursor && user.id !== 'current-user')
          .map(user => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: user.cursor!.x,
                y: user.cursor!.y
              }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute"
            >
              {/* Cursor */}
              <div className="relative">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="drop-shadow-lg"
                >
                  <path
                    d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth="1"
                  />
                </svg>
                
                {/* User label */}
                <div className="absolute top-6 left-2 bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-lg">
                  {user.name}
                </div>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  )
}