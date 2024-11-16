'use client'

import { motion } from 'framer-motion'
import { 
  Plus, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  MessageSquare,
  MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'

const stats = [
  {
    title: 'Total Tasks',
    value: '142',
    change: '+12%',
    trend: 'up',
    icon: CheckCircle,
    color: 'text-green-600'
  },
  {
    title: 'In Progress',
    value: '28',
    change: '+5%',
    trend: 'up',
    icon: Clock,
    color: 'text-blue-600'
  },
  {
    title: 'Team Members',
    value: '16',
    change: '+2',
    trend: 'up',
    icon: Users,
    color: 'text-purple-600'
  },
  {
    title: 'Overdue',
    value: '3',
    change: '-2',
    trend: 'down',
    icon: AlertCircle,
    color: 'text-red-600'
  }
]

const recentTasks = [
  {
    id: 1,
    title: 'Design new landing page',
    project: 'Website Redesign',
    assignee: { name: 'Sarah Chen', avatar: '/avatars/sarah.jpg', initials: 'SC' },
    priority: 'High',
    dueDate: '2024-01-15',
    status: 'In Progress'
  },
  {
    id: 2,
    title: 'Implement user authentication',
    project: 'Mobile App',
    assignee: { name: 'Mike Johnson', avatar: '/avatars/mike.jpg', initials: 'MJ' },
    priority: 'Medium',
    dueDate: '2024-01-18',
    status: 'Review'
  },
  {
    id: 3,
    title: 'Write API documentation',
    project: 'Backend API',
    assignee: { name: 'Alex Kim', avatar: '/avatars/alex.jpg', initials: 'AK' },
    priority: 'Low',
    dueDate: '2024-01-20',
    status: 'Todo'
  },
  {
    id: 4,
    title: 'Create marketing campaign',
    project: 'Campaign Q1',
    assignee: { name: 'Emma Wilson', avatar: '/avatars/emma.jpg', initials: 'EW' },
    priority: 'High',
    dueDate: '2024-01-16',
    status: 'In Progress'
  }
]

const projects = [
  {
    id: 1,
    name: 'Website Redesign',
    progress: 75,
    tasks: { total: 24, completed: 18 },
    team: [
      { name: 'Sarah Chen', initials: 'SC' },
      { name: 'Mike Johnson', initials: 'MJ' },
      { name: 'Alex Kim', initials: 'AK' }
    ],
    dueDate: '2024-02-01'
  },
  {
    id: 2,
    name: 'Mobile App',
    progress: 45,
    tasks: { total: 32, completed: 14 },
    team: [
      { name: 'Emma Wilson', initials: 'EW' },
      { name: 'John Doe', initials: 'JD' }
    ],
    dueDate: '2024-03-15'
  },
  {
    id: 3,
    name: 'Backend API',
    progress: 90,
    tasks: { total: 16, completed: 14 },
    team: [
      { name: 'Alex Kim', initials: 'AK' },
      { name: 'Sarah Chen', initials: 'SC' }
    ],
    dueDate: '2024-01-30'
  }
]

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'Review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'Todo': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    case 'Done': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
  }
}

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Good morning, John! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Here's what's happening with your projects today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <TrendingUp className={`h-4 w-4 mr-1 ${
                    stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last week</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Tasks</CardTitle>
                  <CardDescription>
                    Tasks that need your attention
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={task.assignee.avatar} />
                        <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {task.title}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {task.project} • Due {task.dueDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                      <Badge className={getStatusColor(task.status)}>
                        {task.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Project Progress */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
              <CardDescription>
                Track your active projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {project.name}
                      </h4>
                      <span className="text-sm text-gray-500">
                        {project.progress}%
                      </span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">
                          {project.tasks.completed}/{project.tasks.total} tasks
                        </span>
                        <div className="flex -space-x-2">
                          {project.team.map((member, i) => (
                            <Avatar key={i} className="h-6 w-6 border-2 border-white dark:border-gray-800">
                              <AvatarFallback className="text-xs">
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                      </div>
                      <span className="text-gray-500">
                        Due {project.dueDate}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="ghost" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Task
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Team Member
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Team Chat
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}