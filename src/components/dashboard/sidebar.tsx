'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Home, 
  Users, 
  Folder, 
  Settings, 
  Plus, 
  ChevronDown,
  MoreHorizontal,
  Hash,
  Calendar,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import TeamFlowLogo from '@/components/ui/teamflow-logo'

const workspaces = [
  {
    id: '1',
    name: 'Design Team',
    color: 'bg-blue-500',
    boards: [
      { id: '1', name: 'Website Redesign', icon: Hash },
      { id: '2', name: 'Mobile App', icon: Hash },
      { id: '3', name: 'Brand Guidelines', icon: Hash },
    ]
  },
  {
    id: '2',
    name: 'Development',
    color: 'bg-green-500',
    boards: [
      { id: '4', name: 'Frontend Sprint', icon: Hash },
      { id: '5', name: 'Backend API', icon: Hash },
      { id: '6', name: 'Bug Fixes', icon: Hash },
    ]
  },
  {
    id: '3',
    name: 'Marketing',
    color: 'bg-purple-500',
    boards: [
      { id: '7', name: 'Campaign Q1', icon: Hash },
      { id: '8', name: 'Content Calendar', icon: Hash },
    ]
  }
]

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Tasks', href: '/dashboard/tasks', icon: Users },
  { name: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<string[]>(['1', '2'])
  const pathname = usePathname()

  const toggleWorkspace = (workspaceId: string) => {
    setExpandedWorkspaces(prev => 
      prev.includes(workspaceId) 
        ? prev.filter(id => id !== workspaceId)
        : [...prev, workspaceId]
    )
  }

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <TeamFlowLogo size="sm" showText={false} />
          <span className="text-xl font-bold text-gray-900 dark:text-white">TeamFlow</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive && 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  )}
                >
                  <item.icon className="h-4 w-4 mr-3" />
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>

        {/* Workspaces */}
        <div className="px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Workspaces
            </h3>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-1">
            {workspaces.map((workspace) => {
              const isExpanded = expandedWorkspaces.includes(workspace.id)
              return (
                <div key={workspace.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto"
                    onClick={() => toggleWorkspace(workspace.id)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={cn('w-3 h-3 rounded-full', workspace.color)} />
                      <span className="text-sm font-medium">{workspace.name}</span>
                    </div>
                    <ChevronDown 
                      className={cn(
                        'h-3 w-3 transition-transform',
                        isExpanded && 'rotate-180'
                      )} 
                    />
                  </Button>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 space-y-1"
                    >
                      {workspace.boards.map((board) => (
                        <Link key={board.id} href={`/dashboard/board/${board.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                          >
                            <board.icon className="h-3 w-3 mr-2" />
                            {board.name}
                          </Button>
                        </Link>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs text-gray-400 hover:text-gray-600"
                      >
                        <Plus className="h-3 w-3 mr-2" />
                        Add board
                      </Button>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium text-sm">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              John Doe
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              john@example.com
            </p>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}