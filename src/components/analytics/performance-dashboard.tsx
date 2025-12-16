'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Users, 
  Brain, 
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AnalyticsEngine, PerformanceMetrics, TeamInsight } from '@/lib/analytics'
import { useAuth } from '@/contexts/auth-context'

export function PerformanceDashboard() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [insights, setInsights] = useState<TeamInsight[]>([])
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const analytics = AnalyticsEngine.getInstance()
    
    // Simulate some time tracking data
    setTimeout(() => {
      // Generate sample data
      for (let i = 0; i < 20; i++) {
        const entryId = analytics.startTimeTracking(
          `task-${Math.floor(Math.random() * 5) + 1}`,
          user.id,
          ['focused', 'collaborative', 'meeting'][Math.floor(Math.random() * 3)] as any
        )
        
        // Simulate completed entries
        setTimeout(() => {
          analytics.stopTimeTracking(entryId, Math.floor(Math.random() * 3) + 7)
        }, Math.random() * 1000)
      }

      const userMetrics = analytics.calculatePerformanceMetrics(user.id, timeRange)
      const teamInsights = analytics.generateTeamInsights()
      
      setMetrics(userMetrics)
      setInsights(teamInsights)
      setIsLoading(false)
    }, 1000)
  }, [user, timeRange])

  const handleExport = () => {
    const analytics = AnalyticsEngine.getInstance()
    const data = analytics.exportAnalytics('json')
    
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `teamflow-analytics-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const getBurnoutColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300'
      default: return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
    }
  }

  const performanceCards = [
    {
      title: 'Tasks Completed',
      value: metrics.tasksCompleted,
      icon: CheckCircle,
      color: 'text-green-600',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Productivity Score',
      value: `${Math.round(metrics.productivityScore)}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Focus Time',
      value: `${metrics.focusTime.toFixed(1)}h`,
      icon: Clock,
      color: 'text-purple-600',
      change: '+15%',
      trend: 'up'
    },
    {
      title: 'Team Efficiency',
      value: `${Math.round(metrics.teamEfficiency)}%`,
      icon: Users,
      color: 'text-orange-600',
      change: '+5%',
      trend: 'up'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Performance Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track your productivity and team performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="flex items-center mt-4">
                  <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                  <span className="text-sm font-medium text-green-600">
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">from last {timeRange}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Goal Progress
            </CardTitle>
            <CardDescription>
              Your progress towards weekly goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Weekly Task Goal</span>
                  <span>{Math.round(metrics.goalProgress)}%</span>
                </div>
                <Progress value={metrics.goalProgress} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Collaboration Index</span>
                  <span>{Math.round(metrics.collaborationIndex)}%</span>
                </div>
                <Progress value={metrics.collaborationIndex} className="h-2" />
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Burnout Risk</span>
                  <Badge className={getBurnoutColor(metrics.burnoutRisk)}>
                    {metrics.burnoutRisk.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              AI Insights
            </CardTitle>
            <CardDescription>
              Intelligent recommendations for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.length > 0 ? insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${
                      insight.impact === 'positive' ? 'bg-green-100 text-green-600' :
                      insight.impact === 'negative' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {insight.impact === 'positive' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : insight.impact === 'negative' ? (
                        <AlertTriangle className="h-4 w-4" />
                      ) : (
                        <BarChart3 className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {insight.description}
                      </p>
                      {insight.recommendation && (
                        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                          💡 {insight.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No insights available yet</p>
                  <p className="text-sm">Complete more tasks to generate insights</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}