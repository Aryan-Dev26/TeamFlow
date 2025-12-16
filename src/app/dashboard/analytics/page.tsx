'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target,
  AlertTriangle,
  CheckCircle,
  Zap,
  BarChart3,
  Activity,
  Lightbulb,
  Bot,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useTeamFlowData } from '@/hooks/use-teamflow-data'
import { aiAssistant } from '@/lib/ai-assistant'

export default function AnalyticsPage() {
  const { boards, getTasksByColumnId, getActivities } = useTeamFlowData()
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [aiAnalytics, setAiAnalytics] = useState<any>(null)
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false)

  // Get all tasks across all boards
  const allTasks = useMemo(() => {
    const tasks: any[] = []
    boards.forEach(board => {
      ['todo', 'in-progress', 'review', 'done'].forEach(columnId => {
        const columnTasks = getTasksByColumnId(columnId)
        tasks.push(...columnTasks)
      })
    })
    return tasks
  }, [boards, getTasksByColumnId])

  const activities = getActivities(50)

  // Generate AI insights
  useEffect(() => {
    const generateInsights = async () => {
      setIsGeneratingInsights(true)
      
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const insights = aiAssistant.generateInsights({
        tasks: allTasks,
        teamMembers: [
          { name: 'Sarah Chen', role: 'Designer' },
          { name: 'Mike Johnson', role: 'Developer' },
          { name: 'Alex Kim', role: 'Backend Dev' },
          { name: 'Emma Wilson', role: 'Product Manager' },
          { name: 'John Doe', role: 'Full Stack' }
        ],
        activities
      })

      const analytics = aiAssistant.generateAnalytics({
        tasks: allTasks,
        activities,
        timeframe: selectedTimeframe
      })

      setAiInsights(insights)
      setAiAnalytics(analytics)
      setIsGeneratingInsights(false)
    }

    if (allTasks.length > 0) {
      generateInsights()
    }
  }, [allTasks, activities, selectedTimeframe])

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = allTasks.length
    const completed = allTasks.filter(task => task.columnId === 'done').length
    const inProgress = allTasks.filter(task => task.columnId === 'in-progress').length
    const overdue = allTasks.filter(task => {
      if (!task.dueDate) return false
      return new Date(task.dueDate) < new Date()
    }).length

    return {
      totalTasks: total,
      completedTasks: completed,
      inProgressTasks: inProgress,
      overdueTasks: overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      productivityScore: aiAnalytics?.teamProductivity || 0
    }
  }, [allTasks, aiAnalytics])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'productivity': return TrendingUp
      case 'bottleneck': return AlertTriangle
      case 'suggestion': return Lightbulb
      case 'prediction': return Target
      default: return Brain
    }
  }

  const getInsightColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'low': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      default: return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Brain className="h-8 w-8 text-purple-600" />
            AI Analytics Dashboard
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Powered by artificial intelligence to optimize your team's performance
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {['week', 'month', 'quarter'].map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe as any)}
                className="capitalize"
              >
                {timeframe}
              </Button>
            ))}
          </div>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            <Bot className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      {/* AI Analytics Cards */}
      {aiAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      AI Productivity Score
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {aiAnalytics.teamProductivity}%
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-800">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <Progress value={aiAnalytics.teamProductivity} className="mt-4" />
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                  {aiAnalytics.teamProductivity > 80 ? 'Excellent performance!' : 
                   aiAnalytics.teamProductivity > 60 ? 'Good progress' : 'Needs improvement'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Burnout Risk
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {aiAnalytics.burnoutRisk}%
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-800">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <Progress value={aiAnalytics.burnoutRisk} className="mt-4" />
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                  {aiAnalytics.burnoutRisk < 30 ? 'Low risk' : 
                   aiAnalytics.burnoutRisk < 60 ? 'Moderate risk' : 'High risk - take action'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Project Health
                    </p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {aiAnalytics.projectHealth}%
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-800">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <Progress value={aiAnalytics.projectHealth} className="mt-4" />
                <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                  {aiAnalytics.projectHealth > 80 ? 'Excellent health' : 
                   aiAnalytics.projectHealth > 60 ? 'Good condition' : 'Needs attention'}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Completion Prediction
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {aiAnalytics.completionPrediction}
                    </p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-800">
                    <Target className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  AI-predicted completion date
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Traditional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Tasks
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metrics.totalTasks}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Completed
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {metrics.completedTasks}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  In Progress
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {metrics.inProgressTasks}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {metrics.overdueTasks}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Insights
              {isGeneratingInsights && (
                <div className="flex items-center gap-2 text-sm text-purple-600">
                  <div className="spinner" />
                  Analyzing...
                </div>
              )}
            </CardTitle>
            <CardDescription>
              Intelligent analysis of your team's performance and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {aiInsights.length > 0 ? (
                aiInsights.map((insight, index) => {
                  const Icon = getInsightIcon(insight.type)
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${getInsightColor(insight.impact)}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 mt-0.5 text-gray-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {insight.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {insight.impact} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {insight.description}
                          </p>
                          {insight.actionable && (
                            <Button size="sm" variant="outline" className="mt-2">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">AI is analyzing your data...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Personalized suggestions to improve team productivity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aiAnalytics?.recommendations?.map((recommendation: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                >
                  <Zap className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {recommendation}
                  </p>
                </motion.div>
              )) || (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Generating recommendations...</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}