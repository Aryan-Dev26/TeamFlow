// Integration layer for external services
export interface Integration {
  id: string
  name: string
  type: 'calendar' | 'communication' | 'storage' | 'development' | 'analytics'
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
  lastSync?: string
}

export interface WebhookEvent {
  id: string
  source: string
  type: string
  data: any
  timestamp: string
  processed: boolean
}

export class IntegrationManager {
  private static instance: IntegrationManager
  private integrations: Map<string, Integration> = new Map()
  private webhooks: WebhookEvent[] = []

  static getInstance(): IntegrationManager {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager()
    }
    return IntegrationManager.instance
  }

  // Calendar Integration (Google Calendar, Outlook)
  async connectCalendar(provider: 'google' | 'outlook', config: any): Promise<boolean> {
    try {
      const integration: Integration = {
        id: `calendar-${provider}`,
        name: provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook',
        type: 'calendar',
        status: 'connected',
        config,
        lastSync: new Date().toISOString()
      }

      this.integrations.set(integration.id, integration)
      
      // Simulate calendar sync
      await this.syncCalendarEvents(integration.id)
      
      return true
    } catch (error) {
      console.error('Calendar connection failed:', error)
      return false
    }
  }

  async syncCalendarEvents(integrationId: string): Promise<any[]> {
    const integration = this.integrations.get(integrationId)
    if (!integration || integration.type !== 'calendar') return []

    // Simulate calendar events
    const events = [
      {
        id: 'cal-1',
        title: 'Team Standup',
        start: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
        attendees: ['john@example.com', 'sarah@example.com']
      },
      {
        id: 'cal-2',
        title: 'Project Review',
        start: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        attendees: ['team@example.com']
      }
    ]

    integration.lastSync = new Date().toISOString()
    return events
  }

  // Slack Integration
  async connectSlack(config: { botToken: string, channelId: string }): Promise<boolean> {
    try {
      const integration: Integration = {
        id: 'slack-bot',
        name: 'Slack',
        type: 'communication',
        status: 'connected',
        config,
        lastSync: new Date().toISOString()
      }

      this.integrations.set(integration.id, integration)
      return true
    } catch (error) {
      console.error('Slack connection failed:', error)
      return false
    }
  }

  async sendSlackNotification(message: string, channel?: string): Promise<boolean> {
    const slackIntegration = this.integrations.get('slack-bot')
    if (!slackIntegration || slackIntegration.status !== 'connected') return false

    // Simulate Slack API call
    console.log(`Slack notification sent: ${message}`)
    return true
  }

  // GitHub Integration
  async connectGitHub(config: { token: string, repo: string }): Promise<boolean> {
    try {
      const integration: Integration = {
        id: 'github-repo',
        name: 'GitHub',
        type: 'development',
        status: 'connected',
        config,
        lastSync: new Date().toISOString()
      }

      this.integrations.set(integration.id, integration)
      return true
    } catch (error) {
      console.error('GitHub connection failed:', error)
      return false
    }
  }

  async syncGitHubIssues(): Promise<any[]> {
    const githubIntegration = this.integrations.get('github-repo')
    if (!githubIntegration || githubIntegration.status !== 'connected') return []

    // Simulate GitHub issues
    const issues = [
      {
        id: 'gh-1',
        title: 'Fix authentication bug',
        state: 'open',
        assignee: 'john-doe',
        labels: ['bug', 'high-priority'],
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'gh-2',
        title: 'Add mobile responsive design',
        state: 'in_progress',
        assignee: 'sarah-chen',
        labels: ['enhancement', 'frontend'],
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    githubIntegration.lastSync = new Date().toISOString()
    return issues
  }

  // Webhook Management
  registerWebhook(source: string, endpoint: string): string {
    const webhookId = this.generateId()
    console.log(`Webhook registered: ${source} -> ${endpoint}`)
    return webhookId
  }

  processWebhook(source: string, type: string, data: any): void {
    const webhook: WebhookEvent = {
      id: this.generateId(),
      source,
      type,
      data,
      timestamp: new Date().toISOString(),
      processed: false
    }

    this.webhooks.push(webhook)
    this.handleWebhookEvent(webhook)
  }

  private async handleWebhookEvent(webhook: WebhookEvent): Promise<void> {
    try {
      switch (webhook.source) {
        case 'github':
          await this.handleGitHubWebhook(webhook)
          break
        case 'slack':
          await this.handleSlackWebhook(webhook)
          break
        case 'calendar':
          await this.handleCalendarWebhook(webhook)
          break
      }
      
      webhook.processed = true
    } catch (error) {
      console.error('Webhook processing failed:', error)
    }
  }

  private async handleGitHubWebhook(webhook: WebhookEvent): Promise<void> {
    if (webhook.type === 'issues') {
      // Create task from GitHub issue
      console.log('Creating task from GitHub issue:', webhook.data.issue.title)
    } else if (webhook.type === 'pull_request') {
      // Handle PR events
      console.log('PR event:', webhook.data.action)
    }
  }

  private async handleSlackWebhook(webhook: WebhookEvent): Promise<void> {
    if (webhook.type === 'message') {
      // Process Slack message
      console.log('Slack message received:', webhook.data.text)
    }
  }

  private async handleCalendarWebhook(webhook: WebhookEvent): Promise<void> {
    if (webhook.type === 'event_created') {
      // Create task from calendar event
      console.log('Calendar event created:', webhook.data.summary)
    }
  }

  // Export/Import
  async exportToJira(projectKey: string): Promise<boolean> {
    // Simulate JIRA export
    console.log(`Exporting to JIRA project: ${projectKey}`)
    return true
  }

  async importFromTrello(boardId: string): Promise<any[]> {
    // Simulate Trello import
    const cards = [
      {
        id: 'trello-1',
        name: 'Design new homepage',
        desc: 'Create modern homepage design',
        list: 'To Do',
        members: ['john', 'sarah']
      }
    ]
    
    console.log(`Imported ${cards.length} cards from Trello`)
    return cards
  }

  // API Rate Limiting
  private rateLimits: Map<string, { count: number, resetTime: number }> = new Map()

  private checkRateLimit(service: string, limit: number = 100): boolean {
    const now = Date.now()
    const rateLimit = this.rateLimits.get(service)

    if (!rateLimit || now > rateLimit.resetTime) {
      this.rateLimits.set(service, { count: 1, resetTime: now + 60 * 60 * 1000 }) // 1 hour
      return true
    }

    if (rateLimit.count >= limit) {
      return false
    }

    rateLimit.count++
    return true
  }

  // Utility methods
  getIntegrations(): Integration[] {
    return Array.from(this.integrations.values())
  }

  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id)
  }

  disconnectIntegration(id: string): boolean {
    const integration = this.integrations.get(id)
    if (integration) {
      integration.status = 'disconnected'
      return true
    }
    return false
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
  }
}