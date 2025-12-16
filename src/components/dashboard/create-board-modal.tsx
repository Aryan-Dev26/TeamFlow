'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Hash, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CreateBoardModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onBoardCreated?: (board: any) => void
}

const colorOptions = [
  { name: 'Blue', value: 'bg-blue-500', class: 'bg-blue-500' },
  { name: 'Green', value: 'bg-green-500', class: 'bg-green-500' },
  { name: 'Purple', value: 'bg-purple-500', class: 'bg-purple-500' },
  { name: 'Red', value: 'bg-red-500', class: 'bg-red-500' },
  { name: 'Orange', value: 'bg-orange-500', class: 'bg-orange-500' },
  { name: 'Pink', value: 'bg-pink-500', class: 'bg-pink-500' },
  { name: 'Indigo', value: 'bg-indigo-500', class: 'bg-indigo-500' },
  { name: 'Teal', value: 'bg-teal-500', class: 'bg-teal-500' }
]

export function CreateBoardModal({ isOpen, onClose, workspaceId, onBoardCreated }: CreateBoardModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'bg-blue-500'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsSubmitting(true)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create board object
    const newBoard = {
      name: formData.name,
      description: formData.description,
      color: formData.color,
      workspaceId
    }

    // Call the callback to create the board
    if (onBoardCreated) {
      onBoardCreated(newBoard)
    }
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      color: 'bg-blue-500'
    })
    setIsSubmitting(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md mx-4"
        >
          <Card className="shadow-2xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Create New Board
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Board Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Board Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter board name..."
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this board is for..."
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Color Selection */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Board Color
                  </Label>
                  <div className="grid grid-cols-4 gap-3">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`
                          relative h-12 w-full rounded-lg transition-all duration-200 hover:scale-105
                          ${color.class}
                          ${formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600' : ''}
                        `}
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                      >
                        {formData.color === color.value && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 bg-white rounded-full" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!formData.name.trim() || isSubmitting}>
                    {isSubmitting ? (
                      <div className="flex items-center space-x-2">
                        <div className="spinner" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Board'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}