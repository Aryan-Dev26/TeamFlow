'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Search, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  Plus,
  Users,
  MessageSquare
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CreateTaskModal } from './create-task-modal'

export function Header() {
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false)
  const [notifications] = useState([
    { id: 1, message: 'New task assigned to you', time: '2m ago', unread: true },
    { id: 2, message: 'Project deadline approaching', time: '1h ago', unread: true },
    { id: 3, message: 'Team meeting in 30 minutes', time: '2h ago', unread: false },
  ])

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex items-center space-x-4 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tasks, projects, or people..."
            className="pl-10 bg-gray-50 dark:bg-gray-700 border-0"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Quick Actions */}
        <Button 
          size="sm" 
          className="hidden sm:flex"
          onClick={() => setIsCreateTaskModalOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Button>

        {/* Team Chat */}
        <Button variant="ghost" size="sm" className="relative">
          <MessageSquare className="h-4 w-4" />
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
          >
            3
          </Badge>
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3">
                <div className="flex items-center justify-between w-full">
                  <span className={`text-sm ${notification.unread ? 'font-medium' : ''}`}>
                    {notification.message}
                  </span>
                  {notification.unread && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                  )}
                </div>
                <span className="text-xs text-gray-500 mt-1">{notification.time}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-blue-600">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatars/john-doe.jpg" alt="John Doe" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">John Doe</p>
                <p className="text-xs leading-none text-muted-foreground">
                  john@example.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Users className="mr-2 h-4 w-4" />
              <span>Team Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        columns={[
          { id: 'todo', title: 'To Do', color: 'bg-gray-500' },
          { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500' },
          { id: 'review', title: 'Review', color: 'bg-purple-500' },
          { id: 'done', title: 'Done', color: 'bg-green-500' }
        ]}
      />
    </header>
  )
}