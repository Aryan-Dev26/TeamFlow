'use client'

import { PerformanceDashboard } from '@/components/analytics/performance-dashboard'
import { ActivityFeed } from '@/components/collaboration/activity-feed'
import { TeamPresence } from '@/components/collaboration/team-presence'

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Main Performance Dashboard */}
      <PerformanceDashboard />

      {/* Collaboration Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed />
        <TeamPresence />
      </div>
    </div>
  )
}