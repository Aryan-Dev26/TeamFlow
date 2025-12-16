// AI Assistant for TeamFlow - Simulated AI capabilities
// In production, this would integrate with OpenAI, Claude, or similar APIs

export interface AITaskSuggestion {
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  estimatedHours: number
  tags: string[]
  dependencies?: string[]
  assigneeSuggestion?: string
}

export interface AIInsight {
  type: 'productivity' | 'bottleneck' | 'suggestion' | 'prediction'
  title: string
  description: string
  impact: 'low' | 'medium' | 'high'
  actionable: boolean
  data?: any
}

export interface AIAnalytics {
  teamProductivity: number
  burnoutRisk: number
  projectHealth: number
  completionPrediction: string
  recommendations: string[]
}

class AIAssistant {
  private static instance: AIAssistant

  public static getInstance(): AIAssistant {
    if (!AIAssistant.instance) {
      AIAssistant.instance = new AIAssistant()
    }
    return AIAssistant.instance
  }

  // AI Task Generation
  public generateTaskSuggestions(context: {
    projectType: string
    teamSize: number
    deadline?: string
    existingTasks: any[]
  }): AITaskSuggestion[] {
    const suggestions: AITaskSuggestion[] = []

    // Simulate AI analysis based on context
    if (context.projectType.toLowerCase().includes('website') || context.projectType.toLowerCase().includes('web')) {
      suggestions.push(
        {
          title: 'SEO Optimization Analysis',
          description: 'Conduct comprehensive SEO audit and implement optimization strategies',
          priority: 'Medium',
          estimatedHours: 8,
          tags: ['SEO', 'Marketing', 'Analytics'],
          assigneeSuggestion: 'Marketing Team'
        },
        {
          title: 'Performance Monitoring Setup',
          description: 'Implement real-time performance monitoring and alerting system',
          priority: 'High',
          estimatedHours: 12,
          tags: ['Performance', 'Monitoring', 'DevOps'],
          assigneeSuggestion: 'DevOps Engineer'
        },
        {
          title: 'Accessibility Compliance Audit',
          description: 'Ensure WCAG 2.1 AA compliance across all pages',
          priority: 'Medium',
          estimatedHours: 16,
          tags: ['Accessibility', 'Compliance', 'UX'],
          assigneeSuggestion: 'UX Designer'
        }
      )
    }

    if (context.projectType.toLowerCase().includes('mobile') || context.projectType.toLowerCase().includes('app')) {
      suggestions.push(
        {
          title: 'Push Notification Strategy',
          description: 'Design and implement intelligent push notification system',
          priority: 'Medium',
          estimatedHours: 10,
          tags: ['Mobile', 'Notifications', 'Engagement'],
          assigneeSuggestion: 'Mobile Developer'
        },
        {
          title: 'Offline Functionality',
          description: 'Implement offline-first architecture with data synchronization',
          priority: 'High',
          estimatedHours: 20,
          tags: ['Mobile', 'Offline', 'Sync'],
          assigneeSuggestion: 'Senior Developer'
        }
      )
    }

    // Add general suggestions
    suggestions.push(
      {
        title: 'Security Vulnerability Assessment',
        description: 'Comprehensive security audit and penetration testing',
        priority: 'High',
        estimatedHours: 24,
        tags: ['Security', 'Testing', 'Compliance'],
        assigneeSuggestion: 'Security Engineer'
      },
      {
        title: 'User Analytics Implementation',
        description: 'Set up advanced user behavior tracking and analytics',
        priority: 'Medium',
        estimatedHours: 6,
        tags: ['Analytics', 'User Experience', 'Data'],
        assigneeSuggestion: 'Data Analyst'
      }
    )

    return suggestions.slice(0, 3) // Return top 3 suggestions
  }

  // AI Task Optimization
  public optimizeTask(task: any): {
    optimizedTask: any
    suggestions: string[]
    riskFactors: string[]
  } {
    const suggestions: string[] = []
    const riskFactors: string[] = []
    let optimizedTask = { ...task }

    // Analyze task complexity
    if (task.description && task.description.length > 200) {
      suggestions.push('Consider breaking this task into smaller, more manageable subtasks')
      riskFactors.push('Task complexity may lead to scope creep')
    }

    // Analyze due date
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDue < 2 && task.priority !== 'Urgent') {
        optimizedTask.priority = 'Urgent'
        suggestions.push('Upgraded priority to Urgent due to approaching deadline')
      }

      if (daysUntilDue < 0) {
        riskFactors.push('Task is overdue - immediate attention required')
      }
    }

    // Analyze tags for missing categories
    if (!task.tags.includes('Testing') && task.title.toLowerCase().includes('implement')) {
      suggestions.push('Consider adding testing tasks for this implementation')
    }

    if (!task.tags.includes('Documentation') && task.priority === 'High') {
      suggestions.push('High priority tasks should include documentation')
    }

    return {
      optimizedTask,
      suggestions,
      riskFactors
    }
  }

  // AI Insights Generation
  public generateInsights(data: {
    tasks: any[]
    teamMembers: any[]
    activities: any[]
  }): AIInsight[] {
    const insights: AIInsight[] = []

    // Analyze task distribution
    const tasksByAssignee = data.tasks.reduce((acc, task) => {
      const assignee = task.assignee?.name || 'Unassigned'
      acc[assignee] = (acc[assignee] || 0) + 1
      return acc
    }, {})

    const taskCounts = Object.values(tasksByAssignee) as number[]
    const maxTasks = Math.max(...taskCounts)
    const avgTasks = taskCounts.reduce((a: number, b: number) => a + b, 0) / Object.keys(tasksByAssignee).length

    if (maxTasks > avgTasks * 1.5) {
      insights.push({
        type: 'bottleneck',
        title: 'Workload Imbalance Detected',
        description: 'Some team members have significantly more tasks than others. Consider redistributing workload.',
        impact: 'medium',
        actionable: true,
        data: tasksByAssignee
      })
    }

    // Analyze overdue tasks
    const overdueTasks = data.tasks.filter(task => {
      if (!task.dueDate) return false
      return new Date(task.dueDate) < new Date()
    })

    if (overdueTasks.length > 0) {
      insights.push({
        type: 'productivity',
        title: `${overdueTasks.length} Overdue Tasks Found`,
        description: 'Multiple tasks are past their due dates. This may indicate unrealistic timelines or resource constraints.',
        impact: 'high',
        actionable: true,
        data: { count: overdueTasks.length, tasks: overdueTasks }
      })
    }

    // Analyze task completion patterns
    const completedTasks = data.tasks.filter(task => task.columnId === 'done')
    const totalTasks = data.tasks.length
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0

    if (completionRate > 80) {
      insights.push({
        type: 'productivity',
        title: 'Excellent Team Performance',
        description: `${completionRate.toFixed(1)}% task completion rate indicates high team productivity.`,
        impact: 'high',
        actionable: false
      })
    } else if (completionRate < 30) {
      insights.push({
        type: 'suggestion',
        title: 'Low Completion Rate',
        description: `Only ${completionRate.toFixed(1)}% of tasks are completed. Consider reviewing task complexity and deadlines.`,
        impact: 'medium',
        actionable: true
      })
    }

    // Predict project timeline
    const inProgressTasks = data.tasks.filter(task => task.columnId === 'in-progress').length
    const todoTasks = data.tasks.filter(task => task.columnId === 'todo').length
    
    if (completedTasks.length > 0 && (inProgressTasks + todoTasks) > 0) {
      const avgCompletionTime = 3 // Simulated average days per task
      const remainingDays = (inProgressTasks + todoTasks) * avgCompletionTime
      const estimatedCompletion = new Date()
      estimatedCompletion.setDate(estimatedCompletion.getDate() + remainingDays)

      insights.push({
        type: 'prediction',
        title: 'Project Timeline Prediction',
        description: `Based on current velocity, project completion estimated by ${estimatedCompletion.toLocaleDateString()}.`,
        impact: 'medium',
        actionable: true,
        data: { estimatedDate: estimatedCompletion, remainingTasks: inProgressTasks + todoTasks }
      })
    }

    return insights
  }

  // AI Analytics
  public generateAnalytics(data: {
    tasks: any[]
    activities: any[]
    timeframe: 'week' | 'month' | 'quarter'
  }): AIAnalytics {
    const { tasks, activities } = data

    // Calculate team productivity score
    const completedTasks = tasks.filter(task => task.columnId === 'done').length
    const totalTasks = tasks.length
    const productivityScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

    // Calculate burnout risk
    const highPriorityTasks = tasks.filter(task => task.priority === 'High' || task.priority === 'Urgent').length
    const burnoutRisk = Math.min((highPriorityTasks / totalTasks) * 100, 100)

    // Calculate project health
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false
      return new Date(task.dueDate) < new Date()
    }).length
    const projectHealth = Math.max(100 - (overdueTasks / totalTasks) * 100, 0)

    // Generate completion prediction
    const remainingTasks = tasks.filter(task => task.columnId !== 'done').length
    const avgTasksPerWeek = Math.max(completedTasks / 4, 1) // Assume 4 weeks of data
    const weeksToComplete = Math.ceil(remainingTasks / avgTasksPerWeek)
    const completionDate = new Date()
    completionDate.setDate(completionDate.getDate() + (weeksToComplete * 7))

    // Generate AI recommendations
    const recommendations: string[] = []
    
    if (productivityScore < 50) {
      recommendations.push('Consider implementing daily standups to improve team coordination')
      recommendations.push('Review task complexity and break down large tasks into smaller ones')
    }
    
    if (burnoutRisk > 60) {
      recommendations.push('High burnout risk detected - consider redistributing urgent tasks')
      recommendations.push('Schedule team wellness check-ins and workload reviews')
    }
    
    if (projectHealth < 70) {
      recommendations.push('Multiple overdue tasks detected - review project timeline and resources')
      recommendations.push('Implement automated deadline reminders and progress tracking')
    }

    if (productivityScore > 80 && burnoutRisk < 40) {
      recommendations.push('Team is performing excellently - consider taking on additional challenges')
      recommendations.push('Document current processes as best practices for other teams')
    }

    return {
      teamProductivity: Math.round(productivityScore),
      burnoutRisk: Math.round(burnoutRisk),
      projectHealth: Math.round(projectHealth),
      completionPrediction: completionDate.toLocaleDateString(),
      recommendations
    }
  }

  // AI Chat Assistant
  public processNaturalLanguageQuery(query: string, context: any): {
    response: string
    actions?: any[]
    data?: any
  } {
    const lowerQuery = query.toLowerCase()

    // Task creation queries
    if (lowerQuery.includes('create') && (lowerQuery.includes('task') || lowerQuery.includes('todo'))) {
      return {
        response: "I can help you create a new task! What would you like to work on? I'll suggest the best priority, assignee, and timeline based on your current workload.",
        actions: [{ type: 'open_create_task_modal' }]
      }
    }

    // Status queries
    if (lowerQuery.includes('status') || lowerQuery.includes('progress')) {
      const completedTasks = context.tasks?.filter((t: any) => t.columnId === 'done').length || 0
      const totalTasks = context.tasks?.length || 0
      const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

      return {
        response: `Your project is ${percentage}% complete with ${completedTasks} out of ${totalTasks} tasks finished. ${totalTasks - completedTasks} tasks remaining.`,
        data: { completed: completedTasks, total: totalTasks, percentage }
      }
    }

    // Productivity queries
    if (lowerQuery.includes('productive') || lowerQuery.includes('performance')) {
      return {
        response: "Based on your recent activity, your team is performing well! I notice high collaboration on design tasks and steady progress on development. Would you like detailed analytics?",
        actions: [{ type: 'show_analytics' }]
      }
    }

    // Deadline queries
    if (lowerQuery.includes('deadline') || lowerQuery.includes('due')) {
      const overdueTasks = context.tasks?.filter((t: any) => {
        if (!t.dueDate) return false
        return new Date(t.dueDate) < new Date()
      }).length || 0

      if (overdueTasks > 0) {
        return {
          response: `⚠️ You have ${overdueTasks} overdue task${overdueTasks > 1 ? 's' : ''}. I recommend prioritizing these immediately. Would you like me to help reschedule them?`,
          actions: [{ type: 'show_overdue_tasks' }]
        }
      } else {
        return {
          response: "Great news! All your tasks are on track with no overdue items. Your next deadline is coming up soon - would you like me to show upcoming due dates?",
          actions: [{ type: 'show_upcoming_deadlines' }]
        }
      }
    }

    // Team queries
    if (lowerQuery.includes('team') || lowerQuery.includes('member')) {
      return {
        response: "Your team is actively collaborating! I can see recent activity from all members. Sarah is leading on design tasks, Mike is handling development, and Alex is managing backend work. Need help with team workload balancing?",
        actions: [{ type: 'show_team_analytics' }]
      }
    }

    // Default response
    return {
      response: "I'm your AI assistant for TeamFlow! I can help you with:\n\n• Creating and optimizing tasks\n• Analyzing team productivity\n• Predicting project timelines\n• Managing deadlines\n• Team workload balancing\n\nWhat would you like to know about your project?"
    }
  }

  // Smart Task Prioritization
  public suggestTaskPriority(task: {
    title: string
    description: string
    dueDate?: string
    tags: string[]
  }): {
    suggestedPriority: 'Low' | 'Medium' | 'High' | 'Urgent'
    reasoning: string
    confidence: number
  } {
    let score = 0
    const reasons: string[] = []

    // Analyze keywords in title and description
    const text = `${task.title} ${task.description}`.toLowerCase()
    
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'hotfix', 'bug', 'security']
    const highKeywords = ['important', 'deadline', 'client', 'launch', 'release', 'milestone']
    const mediumKeywords = ['feature', 'improvement', 'enhancement', 'optimize']
    
    urgentKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 3
        reasons.push(`Contains urgent keyword: "${keyword}"`)
      }
    })
    
    highKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 2
        reasons.push(`Contains high-priority keyword: "${keyword}"`)
      }
    })
    
    mediumKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += 1
        reasons.push(`Contains medium-priority keyword: "${keyword}"`)
      }
    })

    // Analyze due date
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysUntilDue <= 1) {
        score += 3
        reasons.push('Due within 24 hours')
      } else if (daysUntilDue <= 3) {
        score += 2
        reasons.push('Due within 3 days')
      } else if (daysUntilDue <= 7) {
        score += 1
        reasons.push('Due within a week')
      }
    }

    // Analyze tags
    const criticalTags = ['security', 'bug', 'hotfix', 'critical']
    const importantTags = ['feature', 'client', 'release']
    
    task.tags.forEach(tag => {
      if (criticalTags.includes(tag.toLowerCase())) {
        score += 2
        reasons.push(`Critical tag: ${tag}`)
      } else if (importantTags.includes(tag.toLowerCase())) {
        score += 1
        reasons.push(`Important tag: ${tag}`)
      }
    })

    // Determine priority and confidence
    let priority: 'Low' | 'Medium' | 'High' | 'Urgent'
    let confidence: number

    if (score >= 6) {
      priority = 'Urgent'
      confidence = 90
    } else if (score >= 4) {
      priority = 'High'
      confidence = 80
    } else if (score >= 2) {
      priority = 'Medium'
      confidence = 70
    } else {
      priority = 'Low'
      confidence = 60
    }

    return {
      suggestedPriority: priority,
      reasoning: reasons.length > 0 ? reasons.join('; ') : 'Based on content analysis',
      confidence
    }
  }
}

export const aiAssistant = AIAssistant.getInstance()