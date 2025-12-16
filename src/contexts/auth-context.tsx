'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  initials: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('teamflow_user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const generateUserId = () => {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  const generateInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if user exists in localStorage
      const users = JSON.parse(localStorage.getItem('teamflow_users') || '[]')
      const existingUser = users.find((u: any) => u.email === email)

      if (existingUser && existingUser.password === password) {
        const userSession = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          avatar: existingUser.avatar,
          initials: existingUser.initials,
          createdAt: existingUser.createdAt
        }
        
        setUser(userSession)
        localStorage.setItem('teamflow_user', JSON.stringify(userSession))
        return true
      }

      // For demo purposes, allow any login with demo data
      if (email && password) {
        const demoUser = {
          id: generateUserId(),
          name: 'Demo User',
          email: email,
          initials: generateInitials('Demo User'),
          createdAt: new Date().toISOString()
        }
        
        setUser(demoUser)
        localStorage.setItem('teamflow_user', JSON.stringify(demoUser))
        return true
      }

      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Check if user already exists
      const users = JSON.parse(localStorage.getItem('teamflow_users') || '[]')
      const existingUser = users.find((u: any) => u.email === email)

      if (existingUser) {
        return false // User already exists
      }

      // Create new user
      const newUser = {
        id: generateUserId(),
        name,
        email,
        password, // In production, this should be hashed
        initials: generateInitials(name),
        createdAt: new Date().toISOString()
      }

      // Save to users list
      users.push(newUser)
      localStorage.setItem('teamflow_users', JSON.stringify(users))

      // Create user session
      const userSession = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        initials: newUser.initials,
        createdAt: newUser.createdAt
      }

      setUser(userSession)
      localStorage.setItem('teamflow_user', JSON.stringify(userSession))
      return true
    } catch (error) {
      console.error('Signup error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    console.log('Logout function called', { user: user?.email })
    
    // Clear user-specific data before setting user to null
    if (user?.id) {
      localStorage.removeItem(`teamflow_data_${user.id}`)
      console.log('Cleared user data for:', user.id)
    }
    
    setUser(null)
    localStorage.removeItem('teamflow_user')
    
    // Also clear any other session-related data
    localStorage.removeItem('teamflow_session')
    
    console.log('Logout completed')
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}