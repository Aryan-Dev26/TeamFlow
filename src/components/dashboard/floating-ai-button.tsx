'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, X, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AIChat } from './ai-chat'

export function FloatingAIButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(true)

  const handleToggle = () => {
    setIsOpen(!isOpen)
    setHasNewMessage(false)
    if (isMinimized) {
      setIsMinimized(false)
    }
  }

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              onClick={handleToggle}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200 relative"
            >
              <Bot className="h-6 w-6 text-white" />
              
              {/* Notification Badge */}
              {hasNewMessage && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-xs text-white font-bold">!</span>
                </motion.div>
              )}

              {/* Pulse Animation */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 animate-ping opacity-20" />
              
              {/* Sparkles */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full"
              >
                <Sparkles className="absolute top-1 right-1 h-3 w-3 text-yellow-300" />
                <Sparkles className="absolute bottom-1 left-1 h-2 w-2 text-yellow-300" />
              </motion.div>
            </Button>

            {/* Tooltip */}
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="absolute right-16 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap shadow-lg"
            >
              Ask AI Assistant
              <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Chat Component */}
      <AIChat
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMinimize={() => setIsMinimized(!isMinimized)}
        isMinimized={isMinimized}
      />
    </>
  )
}