'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { FloatingAIButton } from '@/components/dashboard/floating-ai-button'
import { MobileNavigation } from '@/components/mobile/mobile-navigation'
import { LiveCursors } from '@/components/collaboration/live-cursors'
import { useAuth } from '@/contexts/auth-context'
import { PWAManager } from '@/lib/pwa'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    // Initialize PWA
    const pwa = PWAManager.getInstance()
    pwa.init()
  }, [])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render dashboard if user is not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Desktop Layout */}
      <div className="hidden lg:flex w-full">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto relative">
            {children}
            <FloatingAIButton />
          </main>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden w-full">
        <MobileNavigation />
        <main className="pt-16 pb-20 px-4 overflow-auto">
          {children}
        </main>
      </div>

      {/* Real-time Features */}
      <LiveCursors />
    </div>
  )
}