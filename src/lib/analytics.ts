// Advanced analytics and performance tracking
export interface PerformanceMetrics {
  tasksCompleted: number
  averageCompletionTime: number
  productivityScore: number
  collaborationIndex: number
  focusTime: number
  burnoutRisk: 'low' | 'medium' | 'high'
  teamEfficiency: number
  goalProgress: number
}

export interface TimeTrackingEntry {
  id: string
  taskId: string
  userId: string
  startTime: string
  endTime?: string
  duration?: number
  category: 'focused' | 'collaborative' | 'meeting' | 'break'
  productivity: number // 1-10 scale
}

export interface TeamInsight {
  type: 'productivity' | 'collaboration' | 'workload' | 'quality'
  title: string
  description: string
  impact: 'positive' | 'negative' | 'neutral'
  recommendation?: string
  data: any
}

export class AnalyticsEngine {
  private static instance: AnalyticsEngine
  private timeEntries: TimeTrackingEntry[] = []
  private sessionStart: Date = new Date()

  static getInstance(): AnalyticsEngine {
    if (!AnalyticsEngine.instance) {
      AnalyticsEngine.instance = new AnalyticsEngine()
    }
    return AnalyticsEngine.instance
  }

  // Time tracking
  startTimeTracking(taskId: string, userId: string, category: TimeTrackingEntry['category'] = 'focused'): string {
    const entry: TimeTrackingEntry = {
      id: this.generateId(),
      taskId,
      userId,
      startTime: new Date().toISOString(),
      category,
      productivity: 8 // Default productivity score
    }

    this.timeEntries.push(entry)
    return entry.id
  }

  stopTimeTracking(entryId: string, productivity: number = 8): TimeTrackingEntry | null {
    const entry = this.timeEntries.find(e => e.id === entryId)
    if (!entry || entry.endTime) return null

    const endTime = new Date()
    const startTime = new Date(entry.startTime)
    const duration = endTime.getTime() - startTime.getTime()

    entry.endTime = endTime.toISOString()
    entry.duration = duration
    entry.productivity = productivity

    return entry
  }

  // Performance metrics calculation
  calculatePerformanceMetrics(userId: string, timeRange: 'day' | 'week' | 'month' = 'week'): PerformanceMetrics {
    const now = new Date()
    const startDate = new Date()
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
    }

    const userEntries = this.timeEntries.filter(entry => 
      entry.userId === userId && 
      new Date(entry.startTime) >= startDate &&
      entry.endTime
    )

    const tasksCompleted = new Set(userEntries.map(e => e.taskId)).size
    const totalDuration = userEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const averageCompletionTime = tasksCompleted > 0 ? totalDuration / tasksCompleted : 0
    const averageProductivity = userEntries.length > 0 ? 
      userEntries.reduce((sum, entry) => sum + entry.productivity, 0) / userEntries.length : 0

    const focusTime = userEntries
      .filter(entry => entry.category === 'focused')
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)

    const collaborativeTime = userEntries
      .filter(entry => entry.category === 'collaborative')
      .reduce((sum, entry) => sum + (entry.duration || 0), 0)

    const productivityScore = Math.min(100, (averageProductivity / 10) * 100)
    const collaborationIndex = totalDuration > 0 ? (collaborativeTime / totalDuration) * 100 : 0
    const teamEfficiency = this.calculateTeamEfficiency()
    const burnoutRisk = this.calculateBurnoutRisk(userEntries)
    const goalProgress = this.calculateGoalProgress(userId)

    return {
      tasksCompleted,
      averageCompletionTime: averageCompletionTime / (1000 * 60 * 60), // Convert to hours
      productivityScore,
      collaborationIndex,
      focusTime: focusTime / (1000 * 60 * 60), // Convert to hours
      burnoutRisk,
      teamEfficiency,
      goalProgress
    }
  }

  // Team insights generation
  generateTeamInsights(): TeamInsight[] {
    const insights: TeamInsight[] = []

    // Productivity insight
    const avgProductivity = this.timeEntries.length > 0 ?
      this.timeEntries.reduce((sum, entry) => sum + entry.productivity, 0) / this.timeEntries.length : 0

    if (avgProductivity > 8) {
      insights.push({
        type: 'productivity',
        title: 'High Team Productivity',
        description: `Team is performing exceptionally well with ${avgProductivity.toFixed(1)}/10 average productivity`,
        impact: 'positive',
        recommendation: 'Consider sharing best practices with other teams',
        data: { avgProductivity }
      })
    } else if (avgProductivity < 6) {
      insights.push({
        type: 'productivity',
        title: 'Productivity Opportunity',
        description: `Team productivity is below optimal at ${avgProductivity.toFixed(1)}/10`,
        impact: 'negative',
        recommendation: 'Schedule team retrospective to identify blockers',
        data: { avgProductivity }
      })
    }

    // Collaboration insight
    const collaborativeEntries = this.timeEntries.filter(e => e.category === 'collaborative')
    const collaborationRatio = this.timeEntries.length > 0 ? 
      collaborativeEntries.length / this.timeEntries.length : 0

    if (collaborationRatio > 0.4) {
      insights.push({
        type: 'collaboration',
        title: 'Strong Collaboration',
        description: `${(collaborationRatio * 100).toFixed(0)}% of time spent in collaborative work`,
        impact: 'positive',
        data: { collaborationRatio }
      })
    }

    // Workload insight
    const recentEntries = this.timeEntries.filter(entry => {
      const entryDate = new Date(entry.startTime)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return entryDate >= dayAgo
    })

    const dailyHours = recentEntries.reduce((sum, entry) => 
      sum + ((entry.duration || 0) / (1000 * 60 * 60)), 0)

    if (dailyHours > 10) {
      insights.push({
        type: 'workload',
        title: 'High Workload Detected',
        description: `Team worked ${dailyHours.toFixed(1)} hours in the last 24 hours`,
        impact: 'negative',
        recommendation: 'Consider workload redistribution to prevent burnout',
        data: { dailyHours }
      })
    }

    return insights
  }

  // Predictive analytics
  predictDeadlineRisk(taskId: string): { risk: 'low' | 'medium' | 'high', confidence: number, recommendation: string } {
    // Simulate ML-based deadline prediction
    const taskEntries = this.timeEntries.filter(e => e.taskId === taskId)
    const avgProductivity = taskEntries.length > 0 ?
      taskEntries.reduce((sum, entry) => sum + entry.productivity, 0) / taskEntries.length : 7

    const totalTime = taskEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
    const hoursSpent = totalTime / (1000 * 60 * 60)

    let risk: 'low' | 'medium' | 'high' = 'low'
    let confidence = 0.8
    let recommendation = 'Task is on track'

    if (avgProductivity < 6 && hoursSpent > 8) {
      risk = 'high'
      confidence = 0.9
      recommendation = 'Consider breaking down task or adding resources'
    } else if (avgProductivity < 7 || hoursSpent > 6) {
      risk = 'medium'
      confidence = 0.75
      recommendation = 'Monitor progress closely and remove blockers'
    }

    return { risk, confidence, recommendation }
  }

  // Burnout risk calculation
  private calculateBurnoutRisk(entries: TimeTrackingEntry[]): 'low' | 'medium' | 'high' {
    const totalHours = entries.reduce((sum, entry) => 
      sum + ((entry.duration || 0) / (1000 * 60 * 60)), 0)
    
    const avgProductivity = entries.length > 0 ?
      entries.reduce((sum, entry) => sum + entry.productivity, 0) / entries.length : 8

    const weeklyHours = totalHours * (7 / entries.length) // Extrapolate to weekly

    if (weeklyHours > 50 && avgProductivity < 6) return 'high'
    if (weeklyHours > 45 || avgProductivity < 7) return 'medium'
    return 'low'
  }

  private calculateTeamEfficiency(): number {
    const completedTasks = new Set(
      this.timeEntries
        .filter(e => e.endTime)
        .map(e => e.taskId)
    ).size

    const totalHours = this.timeEntries.reduce((sum, entry) => 
      sum + ((entry.duration || 0) / (1000 * 60 * 60)), 0)

    return totalHours > 0 ? (completedTasks / totalHours) * 10 : 0
  }

  private calculateGoalProgress(userId: string): number {
    // Simulate goal progress calculation
    const userTasks = new Set(
      this.timeEntries
        .filter(e => e.userId === userId && e.endTime)
        .map(e => e.taskId)
    ).size

    const weeklyGoal = 10 // Assume 10 tasks per week goal
    return Math.min(100, (userTasks / weeklyGoal) * 100)
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }

  // Export analytics data
  exportAnalytics(format: 'json' | 'csv' = 'json'): string {
    const data = {
      timeEntries: this.timeEntries,
      insights: this.generateTeamInsights(),
      exportDate: new Date().toISOString()
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    }

    // CSV format
    const csvHeaders = 'ID,Task ID,User ID,Start Time,End Time,Duration (hours),Category,Productivity\n'
    const csvRows = this.timeEntries.map(entry => 
      `${entry.id},${entry.taskId},${entry.userId},${entry.startTime},${entry.endTime || ''},${
        entry.duration ? (entry.duration / (1000 * 60 * 60)).toFixed(2) : ''
      },${entry.category},${entry.productivity}`
    ).join('\n')

    return csvHeaders + csvRows
  }
}