'use client'

import { AuthProvider as AuthContextProvider } from '@/contexts/auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AuthContextProvider>{children}</AuthContextProvider>
}