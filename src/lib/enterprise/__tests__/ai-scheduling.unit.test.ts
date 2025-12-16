// Unit Tests for AI-Powered Scheduling System
import fc from 'fast-check'

describe('AI-Powered Scheduling Unit Tests', () => {
  describe('Task Priority Calculation', () => {
    test('should calculate task priority correctly', () => {
      const calculateTaskPriority = (priority: string, urgency: number, complexity: number): number => {
        const priorityMap = { low: 1, medium: 2, high: 3, critical: 4 }
        const baseScore = priorityMap[priority as keyof typeof priorityMap] || 1
        
        // Handle NaN values
        const safeUrgency = isNaN(urgency) ? 0 : urgency
        const safeComplexity = isNaN(complexity) ? 0 : complexity
        
        return baseScore * (1 + safeUrgency) * (1 + safeComplexity * 0.5)
      }

      fc.assert(fc.property(
        fc.constantFrom('low', 'medium', 'high', 'critical'),
        fc.float({ min: Math.fround(0), max: Math.fround(1) }),
        fc.float({ min: Math.fround(0), max: Math.fround(1) }),
        (priority, urgency, complexity) => {
          const score = calculateTaskPriority(priority, urgency, complexity)
          
          // Score should be positive
          expect(score).toBeGreaterThan(0)
          
          // Critical tasks should have higher scores than low priority
          if (priority === 'critical') {
            const lowScore = calculateTaskPriority('low', urgency, complexity)
            expect(score).toBeGreaterThan(lowScore)
          }
          
          // Higher urgency should increase score
          const lowerUrgencyScore = calculateTaskPriority(priority, urgency * 0.5, complexity)
          expect(score).toBeGreaterThanOrEqual(lowerUrgencyScore)
        }
      ), { numRuns: 50 })
    })
  })

  describe('Skill Matching Algorithm', () => {
    test('should calculate skill match score correctly', () => {
      const calculateSkillMatch = (requiredSkills: string[], userSkills: Record<string, number>): number => {
        if (requiredSkills.length === 0) return 1
        
        let matchScore = 0
        for (const skill of requiredSkills) {
          const skillLevel = userSkills[skill]
          if (typeof skillLevel === 'number' && !isNaN(skillLevel)) {
            matchScore += skillLevel
          }
        }
        
        return Math.min(matchScore / requiredSkills.length, 1)
      }

      fc.assert(fc.property(
        fc.array(fc.string({ minLength: 3, maxLength: 10 }), { minLength: 1, maxLength: 5 }),
        fc.record({
          javascript: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
          react: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
          nodejs: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
          python: fc.float({ min: Math.fround(0), max: Math.fround(1) }),
          design: fc.float({ min: Math.fround(0), max: Math.fround(1) })
        }),
        (requiredSkills, userSkills) => {
          const score = calculateSkillMatch(requiredSkills, userSkills)
          
          // Score should be between 0 and 1
          expect(score).toBeGreaterThanOrEqual(0)
          expect(score).toBeLessThanOrEqual(1)
          
          // Perfect match should give score of 1
          const perfectSkills: Record<string, number> = {}
          requiredSkills.forEach(skill => { perfectSkills[skill] = 1 })
          const perfectScore = calculateSkillMatch(requiredSkills, perfectSkills)
          expect(perfectScore).toBe(1)
          
          // No skills should give score of 0
          const noSkills: Record<string, number> = {}
          const noSkillScore = calculateSkillMatch(requiredSkills, noSkills)
          expect(noSkillScore).toBe(0)
        }
      ), { numRuns: 30 })
    })
  })

  describe('Workload Calculation', () => {
    test('should calculate workload correctly', () => {
      const calculateWorkload = (tasks: Array<{ duration: number; priority: number }>): number => {
        return tasks.reduce((total, task) => {
          return total + (task.duration * task.priority)
        }, 0)
      }

      fc.assert(fc.property(
        fc.array(fc.record({
          duration: fc.integer({ min: 1, max: 480 }), // 1 to 480 minutes
          priority: fc.integer({ min: 1, max: 4 })
        }), { minLength: 0, maxLength: 10 }),
        (tasks) => {
          const workload = calculateWorkload(tasks)
          
          // Workload should be non-negative
          expect(workload).toBeGreaterThanOrEqual(0)
          
          // Empty task list should have zero workload
          if (tasks.length === 0) {
            expect(workload).toBe(0)
          }
          
          // Adding a task should increase workload
          if (tasks.length > 0) {
            const partialWorkload = calculateWorkload(tasks.slice(0, -1))
            expect(workload).toBeGreaterThanOrEqual(partialWorkload)
          }
        }
      ), { numRuns: 25 })
    })
  })

  describe('Meeting Analysis Functions', () => {
    test('should extract action items from text', () => {
      const extractActionItems = (text: string): string[] => {
        const actionPatterns = [
          /(?:need to|should|must|will|let's|have to)\s+([^.!?]+)/gi,
          /(?:action item|todo|task):\s*([^.!?]+)/gi
        ]
        
        const items: string[] = []
        
        for (const pattern of actionPatterns) {
          let match
          while ((match = pattern.exec(text)) !== null) {
            const item = match[1].trim()
            if (item.length > 5) {
              items.push(item)
            }
          }
        }
        
        return items
      }

      // Test with known patterns
      expect(extractActionItems("We need to update the documentation")).toContain("update the documentation")
      expect(extractActionItems("Action item: Review the code")).toContain("Review the code")
      expect(extractActionItems("Let's schedule a meeting")).toContain("schedule a meeting")
      expect(extractActionItems("No action items here")).toHaveLength(0)

      fc.assert(fc.property(
        fc.string({ maxLength: 200 }),
        (text) => {
          const items = extractActionItems(text)
          
          // Should return an array
          expect(Array.isArray(items)).toBe(true)
          
          // All items should be strings with reasonable length
          items.forEach(item => {
            expect(typeof item).toBe('string')
            expect(item.length).toBeGreaterThan(5)
            expect(item.length).toBeLessThan(200)
          })
        }
      ), { numRuns: 20 })
    })

    test('should calculate engagement score', () => {
      const calculateEngagement = (
        speakingTime: number, 
        totalTime: number, 
        interactions: number
      ): number => {
        if (totalTime === 0) return 0
        
        const speakingRatio = Math.min(speakingTime / totalTime, 1)
        const interactionBonus = Math.min(interactions * 0.1, 0.5)
        
        return Math.min(speakingRatio + interactionBonus, 1)
      }

      fc.assert(fc.property(
        fc.integer({ min: 0, max: 3600 }), // speaking time in seconds
        fc.integer({ min: 1, max: 3600 }), // total time in seconds
        fc.integer({ min: 0, max: 20 }), // number of interactions
        (speakingTime, totalTime, interactions) => {
          const engagement = calculateEngagement(speakingTime, totalTime, interactions)
          
          // Engagement should be between 0 and 1
          expect(engagement).toBeGreaterThanOrEqual(0)
          expect(engagement).toBeLessThanOrEqual(1)
          
          // More speaking time should generally increase engagement
          if (speakingTime < totalTime) {
            const higherEngagement = calculateEngagement(speakingTime + 60, totalTime, interactions)
            expect(higherEngagement).toBeGreaterThanOrEqual(engagement)
          }
          
          // More interactions should increase engagement
          const moreInteractions = calculateEngagement(speakingTime, totalTime, interactions + 1)
          expect(moreInteractions).toBeGreaterThanOrEqual(engagement)
        }
      ), { numRuns: 30 })
    })
  })

  describe('AI Response Processing', () => {
    test('should validate AI response structure', () => {
      const validateAIResponse = (response: any): boolean => {
        return (
          typeof response === 'object' &&
          response !== null &&
          typeof response.intent === 'string' &&
          Array.isArray(response.entities) &&
          typeof response.confidence === 'number' &&
          response.confidence >= 0 &&
          response.confidence <= 1 &&
          typeof response.response === 'string' &&
          Array.isArray(response.actions)
        )
      }

      // Valid response
      const validResponse = {
        intent: 'task_creation',
        entities: [],
        confidence: 0.8,
        response: 'I understand you want to create a task.',
        actions: []
      }
      expect(validateAIResponse(validResponse)).toBe(true)

      // Invalid responses
      expect(validateAIResponse(null)).toBe(false)
      expect(validateAIResponse({})).toBe(false)
      expect(validateAIResponse({ intent: 'test' })).toBe(false)
      expect(validateAIResponse({ 
        intent: 'test', 
        entities: [], 
        confidence: 1.5, // Invalid confidence
        response: 'test',
        actions: []
      })).toBe(false)

      fc.assert(fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        fc.array(fc.record({}), { maxLength: 5 }),
        fc.float({ min: Math.fround(0), max: Math.fround(1) }),
        fc.string({ maxLength: 100 }),
        fc.array(fc.record({}), { maxLength: 3 }),
        (intent, entities, confidence, response, actions) => {
          const aiResponse = {
            intent,
            entities,
            confidence,
            response,
            actions
          }
          
          const isValid = validateAIResponse(aiResponse)
          expect(typeof isValid).toBe('boolean')
          
          if (isValid) {
            expect(aiResponse.intent).toBeDefined()
            expect(Array.isArray(aiResponse.entities)).toBe(true)
            expect(aiResponse.confidence).toBeGreaterThanOrEqual(0)
            expect(aiResponse.confidence).toBeLessThanOrEqual(1)
            expect(typeof aiResponse.response).toBe('string')
            expect(Array.isArray(aiResponse.actions)).toBe(true)
          }
        }
      ), { numRuns: 25 })
    })
  })

  describe('Time and Duration Calculations', () => {
    test('should calculate time overlaps correctly', () => {
      const hasTimeOverlap = (
        start1: Date, end1: Date,
        start2: Date, end2: Date
      ): boolean => {
        // Handle invalid dates
        if (isNaN(start1.getTime()) || isNaN(end1.getTime()) || 
            isNaN(start2.getTime()) || isNaN(end2.getTime())) {
          return false
        }
        
        return start1 < end2 && start2 < end1
      }

      fc.assert(fc.property(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.integer({ min: 1, max: 24 * 60 * 60 * 1000 }), // duration in ms
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.integer({ min: 1, max: 24 * 60 * 60 * 1000 }),
        (start1, duration1, start2, duration2) => {
          const end1 = new Date(start1.getTime() + duration1)
          const end2 = new Date(start2.getTime() + duration2)
          
          const overlap = hasTimeOverlap(start1, end1, start2, end2)
          
          // Overlap should be symmetric
          const reverseOverlap = hasTimeOverlap(start2, end2, start1, end1)
          expect(overlap).toBe(reverseOverlap)
          
          // Same time slot should overlap with itself (if valid dates)
          if (!isNaN(start1.getTime()) && !isNaN(end1.getTime())) {
            const selfOverlap = hasTimeOverlap(start1, end1, start1, end1)
            expect(selfOverlap).toBe(true)
          }
          
          // Non-overlapping slots should return false
          if (end1.getTime() <= start2.getTime() || end2.getTime() <= start1.getTime()) {
            expect(overlap).toBe(false)
          }
        }
      ), { numRuns: 30 })
    })

    test('should calculate duration correctly', () => {
      const calculateDuration = (start: Date, end: Date): number => {
        return Math.max(0, end.getTime() - start.getTime())
      }

      fc.assert(fc.property(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
        fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') }),
        (start, end) => {
          const duration = calculateDuration(start, end)
          
          // Duration should be non-negative
          expect(duration).toBeGreaterThanOrEqual(0)
          
          // If end is after start, duration should be positive
          if (end.getTime() > start.getTime()) {
            expect(duration).toBeGreaterThan(0)
            expect(duration).toBe(end.getTime() - start.getTime())
          }
          
          // Same time should have zero duration
          const zeroDuration = calculateDuration(start, start)
          expect(zeroDuration).toBe(0)
        }
      ), { numRuns: 25 })
    })
  })

  describe('Performance Metrics', () => {
    test('should calculate productivity score', () => {
      const calculateProductivityScore = (
        tasksCompleted: number,
        totalTasks: number,
        timeSpent: number,
        estimatedTime: number
      ): number => {
        if (totalTasks === 0 || estimatedTime === 0) return 0
        
        const completionRate = tasksCompleted / totalTasks
        const timeEfficiency = Math.min(estimatedTime / timeSpent, 2) // Cap at 2x efficiency
        
        return Math.min(completionRate * timeEfficiency, 1)
      }

      fc.assert(fc.property(
        fc.integer({ min: 0, max: 20 }),
        fc.integer({ min: 1, max: 20 }),
        fc.integer({ min: 1, max: 1000 }),
        fc.integer({ min: 1, max: 1000 }),
        (completed, total, timeSpent, estimatedTime) => {
          const actualCompleted = Math.min(completed, total)
          const score = calculateProductivityScore(actualCompleted, total, timeSpent, estimatedTime)
          
          // Score should be between 0 and 1
          expect(score).toBeGreaterThanOrEqual(0)
          expect(score).toBeLessThanOrEqual(1)
          
          // Completing all tasks should give higher score than completing none
          const fullScore = calculateProductivityScore(total, total, timeSpent, estimatedTime)
          const zeroScore = calculateProductivityScore(0, total, timeSpent, estimatedTime)
          expect(fullScore).toBeGreaterThanOrEqual(zeroScore)
          
          // Being more time-efficient should increase score
          if (timeSpent > estimatedTime) {
            const efficientScore = calculateProductivityScore(actualCompleted, total, estimatedTime, estimatedTime)
            expect(efficientScore).toBeGreaterThanOrEqual(score)
          }
        }
      ), { numRuns: 30 })
    })
  })
})