// Meeting Intelligence System with AI-Powered Transcription and Analysis
import { EnterpriseWebSocketManager } from './websocket'
import { EnterpriseMonitoring } from './monitoring'
import { RedisManager } from './infrastructure'
import { AIAssistantEngine } from './ai-engine'

// Meeting Intelligence Types
export interface MeetingSession {
  id: string
  title: string
  participants: MeetingParticipant[]
  startTime: Date
  endTime?: Date
  status: 'scheduled' | 'active' | 'completed' | 'cancelled'
  audioStreams: Map<string, AudioStream>
  transcription: RealTimeTranscription
  analysis: MeetingAnalysis
  settings: MeetingSettings
}

export interface MeetingParticipant {
  userId: string
  name: string
  role: 'host' | 'presenter' | 'participant' | 'observer'
  joinTime: Date
  leaveTime?: Date
  speakingTime: number
  engagementScore: number
  audioEnabled: boolean
  videoEnabled: boolean
}

export interface AudioStream {
  participantId: string
  streamId: string
  sampleRate: number
  channels: number
  format: 'pcm' | 'opus' | 'mp3'
  buffer: ArrayBuffer[]
  isActive: boolean
}

export interface RealTimeTranscription {
  segments: TranscriptionSegment[]
  speakers: SpeakerProfile[]
  currentSegment?: TranscriptionSegment
  confidence: number
  language: string
  processingLatency: number
}

export interface TranscriptionSegment {
  id: string
  speakerId: string
  text: string
  startTime: number
  endTime: number
  confidence: number
  words: WordTimestamp[]
  emotions: EmotionAnalysis
  intent: string
}

export interface WordTimestamp {
  word: string
  startTime: number
  endTime: number
  confidence: number
}

export interface SpeakerProfile {
  id: string
  name: string
  voiceprint: number[]
  characteristics: VoiceCharacteristics
  identificationConfidence: number
}

export interface VoiceCharacteristics {
  pitch: number
  tone: string
  pace: number
  volume: number
  accent?: string
}

export interface EmotionAnalysis {
  primary: string
  confidence: number
  emotions: Record<string, number>
  arousal: number
  valence: number
}

export interface MeetingAnalysis {
  summary: string
  keyTopics: Topic[]
  actionItems: ActionItem[]
  decisions: Decision[]
  questions: Question[]
  sentiment: SentimentTrend[]
  engagement: EngagementMetrics
  productivity: ProductivityScore
}

export interface Topic {
  name: string
  mentions: number
  importance: number
  timeSpent: number
  participants: string[]
  sentiment: number
}

export interface ActionItem {
  id: string
  description: string
  assignee?: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'pending' | 'in_progress' | 'completed'
  confidence: number
  context: string
  extractedAt: Date
}

export interface Decision {
  id: string
  description: string
  rationale: string
  alternatives: string[]
  participants: string[]
  confidence: number
  impact: 'low' | 'medium' | 'high'
  timestamp: Date
}

export interface Question {
  id: string
  question: string
  askedBy: string
  answeredBy?: string
  answer?: string
  resolved: boolean
  importance: number
  timestamp: Date
}

export interface SentimentTrend {
  timestamp: Date
  overall: number
  byParticipant: Record<string, number>
  topics: Record<string, number>
}

export interface EngagementMetrics {
  overallScore: number
  participantEngagement: Record<string, number>
  interactionFrequency: number
  questionRate: number
  responseRate: number
  attentionSpan: number
}

export interface ProductivityScore {
  overall: number
  timeUtilization: number
  goalAchievement: number
  actionItemGeneration: number
  decisionMaking: number
  focusScore: number
}

export interface MeetingSettings {
  enableTranscription: boolean
  enableSpeakerIdentification: boolean
  enableEmotionAnalysis: boolean
  enableRealTimeAnalysis: boolean
  language: string
  transcriptionAccuracy: 'fast' | 'balanced' | 'accurate'
  saveRecording: boolean
  generateSummary: boolean
  extractActionItems: boolean
}

// Meeting Intelligence Engine
export class MeetingIntelligenceEngine {
  private websocketManager: EnterpriseWebSocketManager
  private redisManager: RedisManager
  private monitoring: EnterpriseMonitoring
  private aiEngine: AIAssistantEngine
  private activeMeetings: Map<string, MeetingSession> = new Map()
  private transcriptionQueue: Map<string, AudioChunk[]> = new Map()
  private analysisCache: Map<string, MeetingAnalysis> = new Map()

  constructor(websocketManager: EnterpriseWebSocketManager, aiEngine: AIAssistantEngine) {
    this.websocketManager = websocketManager
    this.redisManager = RedisManager.getInstance()
    this.monitoring = EnterpriseMonitoring.getInstance()
    this.aiEngine = aiEngine
    
    this.setupEventHandlers()
    this.startTranscriptionProcessor()
    this.startAnalysisProcessor()
  }

  private setupEventHandlers(): void {
    this.websocketManager.getSocketIO().on('connection', (socket) => {
      socket.on('meeting:start-intelligence', (data) => this.handleStartIntelligence(socket, data))
      socket.on('meeting:audio-stream', (data) => this.handleAudioStream(socket, data))
      socket.on('meeting:request-analysis', (data) => this.handleAnalysisRequest(socket, data))
      socket.on('meeting:stop-intelligence', (data) => this.handleStopIntelligence(socket, data))
    })
  }

  async startMeetingIntelligence(meetingId: string, settings: MeetingSettings): Promise<MeetingSession> {
    const session: MeetingSession = {
      id: meetingId,
      title: `Meeting ${meetingId}`,
      participants: [],
      startTime: new Date(),
      status: 'active',
      audioStreams: new Map(),
      transcription: {
        segments: [],
        speakers: [],
        confidence: 0,
        language: settings.language,
        processingLatency: 0
      },
      analysis: {
        summary: '',
        keyTopics: [],
        actionItems: [],
        decisions: [],
        questions: [],
        sentiment: [],
        engagement: {
          overallScore: 0,
          participantEngagement: {},
          interactionFrequency: 0,
          questionRate: 0,
          responseRate: 0,
          attentionSpan: 0
        },
        productivity: {
          overall: 0,
          timeUtilization: 0,
          goalAchievement: 0,
          actionItemGeneration: 0,
          decisionMaking: 0,
          focusScore: 0
        }
      },
      settings
    }

    this.activeMeetings.set(meetingId, session)
    this.transcriptionQueue.set(meetingId, [])

    // Initialize real-time processing
    if (settings.enableRealTimeAnalysis) {
      this.startRealTimeAnalysis(meetingId)
    }

    this.monitoring.recordMetric('meeting_intelligence.sessions.started', 1, { meetingId })
    return session
  }

  private async handleStartIntelligence(socket: any, data: {
    meetingId: string
    settings: MeetingSettings
    userId: string
  }): Promise<void> {
    try {
      const session = await this.startMeetingIntelligence(data.meetingId, data.settings)
      
      socket.emit('meeting:intelligence-started', {
        meetingId: data.meetingId,
        sessionId: session.id,
        capabilities: this.getIntelligenceCapabilities()
      })

    } catch (error) {
      console.error('Error starting meeting intelligence:', error)
      socket.emit('meeting:intelligence-error', { message: 'Failed to start meeting intelligence' })
    }
  }

  private async handleAudioStream(socket: any, data: {
    meetingId: string
    participantId: string
    audioData: ArrayBuffer
    timestamp: number
  }): Promise<void> {
    try {
      await this.processAudioStream(data.meetingId, data.participantId, data.audioData, data.timestamp)
      
      // Send acknowledgment
      socket.emit('meeting:audio-received', {
        meetingId: data.meetingId,
        timestamp: data.timestamp
      })

    } catch (error) {
      console.error('Error processing audio stream:', error)
    }
  }

  private async processAudioStream(meetingId: string, participantId: string, audioData: ArrayBuffer, timestamp: number): Promise<void> {
    const session = this.activeMeetings.get(meetingId)
    if (!session) return

    // Add to transcription queue
    const queue = this.transcriptionQueue.get(meetingId) || []
    queue.push({
      participantId,
      audioData,
      timestamp,
      processed: false
    })
    this.transcriptionQueue.set(meetingId, queue)

    // Update audio stream
    if (!session.audioStreams.has(participantId)) {
      session.audioStreams.set(participantId, {
        participantId,
        streamId: `stream_${participantId}_${Date.now()}`,
        sampleRate: 16000,
        channels: 1,
        format: 'pcm',
        buffer: [],
        isActive: true
      })
    }

    const stream = session.audioStreams.get(participantId)!
    stream.buffer.push(audioData)
    stream.isActive = true

    // Keep buffer size manageable
    if (stream.buffer.length > 100) {
      stream.buffer = stream.buffer.slice(-50)
    }

    this.monitoring.recordMetric('meeting_intelligence.audio.processed', audioData.byteLength, { meetingId })
  }

  private async transcribeAudio(audioChunk: AudioChunk): Promise<TranscriptionSegment | null> {
    try {
      // Convert audio to text using speech-to-text service
      const transcriptionResult = await this.callSpeechToTextAPI(audioChunk.audioData)
      
      if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
        return null
      }

      // Identify speaker
      const speakerId = await this.identifySpeaker(audioChunk.audioData, audioChunk.participantId)
      
      // Analyze emotions
      const emotions = await this.analyzeEmotions(transcriptionResult.text, audioChunk.audioData)
      
      // Extract intent
      const intent = await this.extractIntent(transcriptionResult.text)

      const segment: TranscriptionSegment = {
        id: `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        speakerId,
        text: transcriptionResult.text,
        startTime: audioChunk.timestamp,
        endTime: audioChunk.timestamp + this.estimateAudioDuration(audioChunk.audioData),
        confidence: transcriptionResult.confidence,
        words: transcriptionResult.words || [],
        emotions,
        intent
      }

      return segment

    } catch (error) {
      console.error('Error transcribing audio:', error)
      this.monitoring.recordMetric('meeting_intelligence.transcription.errors', 1)
      return null
    }
  }

  private async callSpeechToTextAPI(audioData: ArrayBuffer): Promise<{
    text: string
    confidence: number
    words?: WordTimestamp[]
  }> {
    // Integration with speech-to-text services (Google Cloud Speech, Azure Speech, etc.)
    // This is a mock implementation
    
    const mockText = this.generateMockTranscription()
    
    return {
      text: mockText,
      confidence: 0.85 + Math.random() * 0.1,
      words: this.generateMockWordTimestamps(mockText)
    }
  }

  private generateMockTranscription(): string {
    const phrases = [
      "Let's discuss the project timeline and deliverables.",
      "I think we need to prioritize the user experience improvements.",
      "What are the main blockers we're facing right now?",
      "We should schedule a follow-up meeting next week.",
      "The budget allocation looks good for this quarter.",
      "Can we get an update on the development progress?",
      "I agree with the proposed solution approach.",
      "We need to consider the security implications.",
      "The client feedback has been very positive so far.",
      "Let's assign action items before we wrap up."
    ]
    
    return phrases[Math.floor(Math.random() * phrases.length)]
  }

  private generateMockWordTimestamps(text: string): WordTimestamp[] {
    const words = text.split(' ')
    let currentTime = 0
    
    return words.map(word => {
      const duration = 200 + Math.random() * 300 // 200-500ms per word
      const timestamp: WordTimestamp = {
        word,
        startTime: currentTime,
        endTime: currentTime + duration,
        confidence: 0.8 + Math.random() * 0.2
      }
      currentTime += duration + 50 // 50ms pause between words
      return timestamp
    })
  }

  private async identifySpeaker(audioData: ArrayBuffer, participantId: string): Promise<string> {
    // Speaker identification using voice biometrics
    // For now, return the participant ID
    return participantId
  }

  private async analyzeEmotions(text: string, audioData: ArrayBuffer): Promise<EmotionAnalysis> {
    // Emotion analysis from both text and audio
    const textEmotions = await this.analyzeTextEmotions(text)
    const audioEmotions = await this.analyzeAudioEmotions(audioData)
    
    // Combine text and audio emotion analysis
    const combinedEmotions = this.combineEmotionAnalysis(textEmotions, audioEmotions)
    
    return combinedEmotions
  }

  private async analyzeTextEmotions(text: string): Promise<EmotionAnalysis> {
    // Simple sentiment analysis - in production, use advanced NLP models
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'agree', 'success']
    const negativeWords = ['bad', 'terrible', 'negative', 'disagree', 'problem', 'issue']
    
    const words = text.toLowerCase().split(' ')
    let positiveScore = 0
    let negativeScore = 0
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveScore++
      if (negativeWords.includes(word)) negativeScore++
    })
    
    const totalScore = positiveScore - negativeScore
    const primary = totalScore > 0 ? 'positive' : totalScore < 0 ? 'negative' : 'neutral'
    
    return {
      primary,
      confidence: 0.7,
      emotions: {
        joy: Math.max(0, totalScore * 0.3),
        sadness: Math.max(0, -totalScore * 0.3),
        anger: Math.max(0, -totalScore * 0.2),
        fear: 0.1,
        surprise: 0.1,
        disgust: Math.max(0, -totalScore * 0.1)
      },
      arousal: 0.5 + Math.abs(totalScore) * 0.1,
      valence: 0.5 + totalScore * 0.1
    }
  }

  private async analyzeAudioEmotions(audioData: ArrayBuffer): Promise<EmotionAnalysis> {
    // Audio-based emotion analysis (pitch, tone, pace)
    // Mock implementation
    return {
      primary: 'neutral',
      confidence: 0.6,
      emotions: {
        joy: 0.3,
        sadness: 0.1,
        anger: 0.1,
        fear: 0.1,
        surprise: 0.2,
        disgust: 0.1
      },
      arousal: 0.5,
      valence: 0.5
    }
  }

  private combineEmotionAnalysis(textEmotions: EmotionAnalysis, audioEmotions: EmotionAnalysis): EmotionAnalysis {
    // Weighted combination of text and audio emotions
    const textWeight = 0.6
    const audioWeight = 0.4
    
    const combinedEmotions: Record<string, number> = {}
    
    for (const emotion in textEmotions.emotions) {
      combinedEmotions[emotion] = 
        (textEmotions.emotions[emotion] * textWeight) + 
        (audioEmotions.emotions[emotion] * audioWeight)
    }
    
    // Find primary emotion
    const primary = Object.entries(combinedEmotions)
      .reduce((a, b) => combinedEmotions[a[0]] > combinedEmotions[b[0]] ? a : b)[0]
    
    return {
      primary,
      confidence: (textEmotions.confidence * textWeight) + (audioEmotions.confidence * audioWeight),
      emotions: combinedEmotions,
      arousal: (textEmotions.arousal * textWeight) + (audioEmotions.arousal * audioWeight),
      valence: (textEmotions.valence * textWeight) + (audioEmotions.valence * audioWeight)
    }
  }

  private async extractIntent(text: string): Promise<string> {
    // Intent classification using NLP
    const intents = {
      question: ['what', 'how', 'when', 'where', 'why', 'who', '?'],
      action: ['should', 'need to', 'must', 'have to', 'let\'s', 'will'],
      agreement: ['yes', 'agree', 'correct', 'right', 'exactly'],
      disagreement: ['no', 'disagree', 'wrong', 'incorrect', 'but'],
      information: ['is', 'are', 'was', 'were', 'the', 'this', 'that']
    }
    
    const lowerText = text.toLowerCase()
    
    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return intent
      }
    }
    
    return 'statement'
  }

  private estimateAudioDuration(audioData: ArrayBuffer): number {
    // Estimate duration based on audio data size
    // Assuming 16kHz, 16-bit, mono audio
    const bytesPerSecond = 16000 * 2 // 16kHz * 2 bytes per sample
    return (audioData.byteLength / bytesPerSecond) * 1000 // Convert to milliseconds
  }

  private startTranscriptionProcessor(): void {
    setInterval(async () => {
      await this.processTranscriptionQueue()
    }, 1000) // Process every second
  }

  private async processTranscriptionQueue(): Promise<void> {
    for (const [meetingId, queue] of this.transcriptionQueue) {
      const session = this.activeMeetings.get(meetingId)
      if (!session) continue

      const unprocessedChunks = queue.filter(chunk => !chunk.processed)
      
      for (const chunk of unprocessedChunks.slice(0, 5)) { // Process up to 5 chunks at a time
        const segment = await this.transcribeAudio(chunk)
        
        if (segment) {
          session.transcription.segments.push(segment)
          session.transcription.currentSegment = segment
          
          // Broadcast real-time transcription
          this.websocketManager.broadcastToRoom(`meeting:${meetingId}`, 'meeting:transcription', {
            meetingId,
            segment
          })
          
          // Trigger real-time analysis
          if (session.settings.enableRealTimeAnalysis) {
            await this.analyzeSegmentRealTime(meetingId, segment)
          }
        }
        
        chunk.processed = true
      }
      
      // Clean up processed chunks
      this.transcriptionQueue.set(meetingId, queue.filter(chunk => !chunk.processed))
    }
  }

  private async analyzeSegmentRealTime(meetingId: string, segment: TranscriptionSegment): Promise<void> {
    const session = this.activeMeetings.get(meetingId)
    if (!session) return

    // Extract action items
    const actionItems = await this.extractActionItems([segment])
    session.analysis.actionItems.push(...actionItems)

    // Extract decisions
    const decisions = await this.extractDecisions([segment])
    session.analysis.decisions.push(...decisions)

    // Extract questions
    const questions = await this.extractQuestions([segment])
    session.analysis.questions.push(...questions)

    // Update sentiment trend
    const sentimentPoint: SentimentTrend = {
      timestamp: new Date(segment.startTime),
      overall: segment.emotions.valence,
      byParticipant: { [segment.speakerId]: segment.emotions.valence },
      topics: {}
    }
    session.analysis.sentiment.push(sentimentPoint)

    // Broadcast real-time analysis updates
    this.websocketManager.broadcastToRoom(`meeting:${meetingId}`, 'meeting:analysis-update', {
      meetingId,
      actionItems: actionItems,
      decisions: decisions,
      questions: questions,
      sentiment: sentimentPoint
    })
  }

  private async extractActionItems(segments: TranscriptionSegment[]): Promise<ActionItem[]> {
    const actionItems: ActionItem[] = []
    
    for (const segment of segments) {
      const text = segment.text.toLowerCase()
      
      // Look for action-oriented language
      const actionPatterns = [
        /(?:need to|should|must|will|let's|have to)\s+(.+?)(?:\.|$)/gi,
        /(?:action item|todo|task):\s*(.+?)(?:\.|$)/gi,
        /(?:assign|delegate)\s+(.+?)\s+to\s+(\w+)/gi
      ]
      
      for (const pattern of actionPatterns) {
        let match
        while ((match = pattern.exec(text)) !== null) {
          const description = match[1].trim()
          const assignee = match[2] || undefined
          
          if (description.length > 5) { // Filter out very short matches
            actionItems.push({
              id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description,
              assignee,
              priority: this.determinePriority(description),
              status: 'pending',
              confidence: 0.7,
              context: segment.text,
              extractedAt: new Date()
            })
          }
        }
      }
    }
    
    return actionItems
  }

  private async extractDecisions(segments: TranscriptionSegment[]): Promise<Decision[]> {
    const decisions: Decision[] = []
    
    for (const segment of segments) {
      const text = segment.text.toLowerCase()
      
      // Look for decision-making language
      const decisionPatterns = [
        /(?:we (?:decided|agreed|chose)|decision|conclusion):\s*(.+?)(?:\.|$)/gi,
        /(?:let's go with|we'll use|final decision)\s+(.+?)(?:\.|$)/gi
      ]
      
      for (const pattern of decisionPatterns) {
        let match
        while ((match = pattern.exec(text)) !== null) {
          const description = match[1].trim()
          
          if (description.length > 5) {
            decisions.push({
              id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description,
              rationale: segment.text,
              alternatives: [],
              participants: [segment.speakerId],
              confidence: 0.8,
              impact: this.determineImpact(description),
              timestamp: new Date(segment.startTime)
            })
          }
        }
      }
    }
    
    return decisions
  }

  private async extractQuestions(segments: TranscriptionSegment[]): Promise<Question[]> {
    const questions: Question[] = []
    
    for (const segment of segments) {
      if (segment.intent === 'question' || segment.text.includes('?')) {
        questions.push({
          id: `question_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          question: segment.text,
          askedBy: segment.speakerId,
          resolved: false,
          importance: this.determineQuestionImportance(segment.text),
          timestamp: new Date(segment.startTime)
        })
      }
    }
    
    return questions
  }

  private determinePriority(description: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency']
    const highWords = ['important', 'priority', 'soon', 'quickly']
    
    const lowerDesc = description.toLowerCase()
    
    if (urgentWords.some(word => lowerDesc.includes(word))) return 'critical'
    if (highWords.some(word => lowerDesc.includes(word))) return 'high'
    if (lowerDesc.includes('when possible') || lowerDesc.includes('eventually')) return 'low'
    
    return 'medium'
  }

  private determineImpact(description: string): 'low' | 'medium' | 'high' {
    const highImpactWords = ['major', 'significant', 'critical', 'strategic', 'budget']
    const lowImpactWords = ['minor', 'small', 'cosmetic', 'optional']
    
    const lowerDesc = description.toLowerCase()
    
    if (highImpactWords.some(word => lowerDesc.includes(word))) return 'high'
    if (lowImpactWords.some(word => lowerDesc.includes(word))) return 'low'
    
    return 'medium'
  }

  private determineQuestionImportance(question: string): number {
    const importantWords = ['budget', 'timeline', 'deadline', 'risk', 'blocker', 'critical']
    const lowerQuestion = question.toLowerCase()
    
    const matches = importantWords.filter(word => lowerQuestion.includes(word)).length
    return Math.min(matches * 0.3 + 0.4, 1.0) // Base importance 0.4, up to 1.0
  }

  private startAnalysisProcessor(): void {
    setInterval(async () => {
      await this.processAnalysisUpdates()
    }, 30000) // Process every 30 seconds
  }

  private async processAnalysisUpdates(): Promise<void> {
    for (const [meetingId, session] of this.activeMeetings) {
      if (session.status === 'active') {
        await this.updateMeetingAnalysis(meetingId)
      }
    }
  }

  private async updateMeetingAnalysis(meetingId: string): Promise<void> {
    const session = this.activeMeetings.get(meetingId)
    if (!session) return

    // Update engagement metrics
    session.analysis.engagement = await this.calculateEngagementMetrics(session)
    
    // Update productivity score
    session.analysis.productivity = await this.calculateProductivityScore(session)
    
    // Update key topics
    session.analysis.keyTopics = await this.extractKeyTopics(session.transcription.segments)
    
    // Generate summary if enough content
    if (session.transcription.segments.length > 10) {
      session.analysis.summary = await this.generateMeetingSummary(session)
    }

    // Cache analysis
    this.analysisCache.set(meetingId, session.analysis)
  }

  private async calculateEngagementMetrics(session: MeetingSession): Promise<EngagementMetrics> {
    const segments = session.transcription.segments
    const participants = Array.from(session.audioStreams.keys())
    
    // Calculate speaking time per participant
    const speakingTime: Record<string, number> = {}
    const participantSegments: Record<string, number> = {}
    
    for (const segment of segments) {
      const duration = segment.endTime - segment.startTime
      speakingTime[segment.speakerId] = (speakingTime[segment.speakerId] || 0) + duration
      participantSegments[segment.speakerId] = (participantSegments[segment.speakerId] || 0) + 1
    }
    
    // Calculate engagement scores
    const participantEngagement: Record<string, number> = {}
    const totalSpeakingTime = Object.values(speakingTime).reduce((sum, time) => sum + time, 0)
    
    for (const participantId of participants) {
      const speakingRatio = (speakingTime[participantId] || 0) / totalSpeakingTime
      const segmentCount = participantSegments[participantId] || 0
      const averageSegmentLength = segmentCount > 0 ? speakingTime[participantId] / segmentCount : 0
      
      // Engagement score based on speaking time, frequency, and segment length
      participantEngagement[participantId] = Math.min(
        speakingRatio * 2 + // Speaking time contribution
        (segmentCount / segments.length) * 2 + // Participation frequency
        Math.min(averageSegmentLength / 5000, 1), // Optimal segment length (5 seconds)
        1.0
      )
    }
    
    const overallScore = Object.values(participantEngagement).reduce((sum, score) => sum + score, 0) / participants.length
    
    return {
      overallScore,
      participantEngagement,
      interactionFrequency: segments.length / Math.max((Date.now() - session.startTime.getTime()) / 60000, 1), // per minute
      questionRate: session.analysis.questions.length / Math.max(segments.length, 1),
      responseRate: 0.8, // Mock value - would calculate based on question-answer pairs
      attentionSpan: this.calculateAttentionSpan(segments)
    }
  }

  private calculateAttentionSpan(segments: TranscriptionSegment[]): number {
    // Calculate average time between speaker changes as a proxy for attention span
    let totalGaps = 0
    let gapCount = 0
    
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].speakerId !== segments[i-1].speakerId) {
        const gap = segments[i].startTime - segments[i-1].endTime
        if (gap > 0 && gap < 30000) { // Ignore gaps > 30 seconds (likely breaks)
          totalGaps += gap
          gapCount++
        }
      }
    }
    
    return gapCount > 0 ? totalGaps / gapCount : 5000 // Default 5 seconds
  }

  private async calculateProductivityScore(session: MeetingSession): Promise<ProductivityScore> {
    const duration = Date.now() - session.startTime.getTime()
    const segments = session.transcription.segments
    
    // Time utilization (speaking time vs total time)
    const totalSpeakingTime = segments.reduce((sum, seg) => sum + (seg.endTime - seg.startTime), 0)
    const timeUtilization = Math.min(totalSpeakingTime / duration, 1)
    
    // Action item generation rate
    const actionItemGeneration = Math.min(session.analysis.actionItems.length / Math.max(duration / 3600000, 0.5), 1) // per hour
    
    // Decision making rate
    const decisionMaking = Math.min(session.analysis.decisions.length / Math.max(duration / 3600000, 0.5), 1)
    
    // Focus score based on topic consistency
    const focusScore = await this.calculateFocusScore(segments)
    
    const overall = (timeUtilization * 0.3 + actionItemGeneration * 0.3 + decisionMaking * 0.2 + focusScore * 0.2)
    
    return {
      overall,
      timeUtilization,
      goalAchievement: 0.7, // Mock value - would need meeting goals to calculate
      actionItemGeneration,
      decisionMaking,
      focusScore
    }
  }

  private async calculateFocusScore(segments: TranscriptionSegment[]): Promise<number> {
    // Analyze topic consistency and focus
    const topics = await this.extractKeyTopics(segments)
    
    if (topics.length === 0) return 0.5
    
    // Calculate how much time was spent on top topics vs scattered discussion
    const totalMentions = topics.reduce((sum, topic) => sum + topic.mentions, 0)
    const topTopicMentions = topics.slice(0, 3).reduce((sum, topic) => sum + topic.mentions, 0)
    
    return totalMentions > 0 ? topTopicMentions / totalMentions : 0.5
  }

  private async extractKeyTopics(segments: TranscriptionSegment[]): Promise<Topic[]> {
    // Simple keyword extraction - in production, use advanced NLP
    const wordCounts = new Map<string, number>()
    const topicParticipants = new Map<string, Set<string>>()
    const topicSentiment = new Map<string, number[]>()
    
    // Common stop words to filter out
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'])
    
    for (const segment of segments) {
      const words = segment.text.toLowerCase().split(/\W+/).filter(word => 
        word.length > 3 && !stopWords.has(word)
      )
      
      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
        
        if (!topicParticipants.has(word)) {
          topicParticipants.set(word, new Set())
        }
        topicParticipants.get(word)!.add(segment.speakerId)
        
        if (!topicSentiment.has(word)) {
          topicSentiment.set(word, [])
        }
        topicSentiment.get(word)!.push(segment.emotions.valence)
      }
    }
    
    // Convert to topics and sort by importance
    const topics: Topic[] = Array.from(wordCounts.entries())
      .filter(([word, count]) => count >= 2) // Minimum 2 mentions
      .map(([word, count]) => ({
        name: word,
        mentions: count,
        importance: count / segments.length,
        timeSpent: count * 5000, // Estimate 5 seconds per mention
        participants: Array.from(topicParticipants.get(word) || []),
        sentiment: topicSentiment.get(word)!.reduce((sum, val) => sum + val, 0) / topicSentiment.get(word)!.length
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10) // Top 10 topics
    
    return topics
  }

  private async generateMeetingSummary(session: MeetingSession): Promise<string> {
    // Generate AI-powered meeting summary
    const segments = session.transcription.segments
    const keyTopics = session.analysis.keyTopics.slice(0, 5)
    const actionItems = session.analysis.actionItems
    const decisions = session.analysis.decisions
    
    const summaryPrompt = `
    Generate a concise meeting summary based on the following information:
    
    Key Topics Discussed: ${keyTopics.map(t => t.name).join(', ')}
    
    Action Items: ${actionItems.map(a => a.description).join('; ')}
    
    Decisions Made: ${decisions.map(d => d.description).join('; ')}
    
    Meeting Duration: ${Math.round((Date.now() - session.startTime.getTime()) / 60000)} minutes
    
    Participants: ${Array.from(session.audioStreams.keys()).length}
    
    Please provide a structured summary including:
    1. Main discussion points
    2. Key decisions
    3. Action items
    4. Next steps
    `
    
    try {
      // Use AI engine to generate summary
      const response = await this.aiEngine.processNaturalLanguage({
        id: `summary_${session.id}`,
        text: summaryPrompt,
        context: { meetingId: session.id },
        userId: 'system',
        timestamp: new Date(),
        type: 'analysis'
      })
      
      return response.response
      
    } catch (error) {
      console.error('Error generating AI summary:', error)
      
      // Fallback to template-based summary
      return this.generateTemplateSummary(session)
    }
  }

  private generateTemplateSummary(session: MeetingSession): string {
    const duration = Math.round((Date.now() - session.startTime.getTime()) / 60000)
    const participantCount = Array.from(session.audioStreams.keys()).length
    const keyTopics = session.analysis.keyTopics.slice(0, 3)
    const actionItems = session.analysis.actionItems
    const decisions = session.analysis.decisions
    
    let summary = `Meeting Summary (${duration} minutes, ${participantCount} participants)\n\n`
    
    if (keyTopics.length > 0) {
      summary += `Key Topics Discussed:\n${keyTopics.map(t => `• ${t.name} (${t.mentions} mentions)`).join('\n')}\n\n`
    }
    
    if (decisions.length > 0) {
      summary += `Decisions Made:\n${decisions.map(d => `• ${d.description}`).join('\n')}\n\n`
    }
    
    if (actionItems.length > 0) {
      summary += `Action Items:\n${actionItems.map(a => `• ${a.description}${a.assignee ? ` (${a.assignee})` : ''}`).join('\n')}\n\n`
    }
    
    return summary
  }

  private startRealTimeAnalysis(meetingId: string): void {
    // Start real-time analysis for the meeting
    console.log(`Starting real-time analysis for meeting ${meetingId}`)
  }

  private getIntelligenceCapabilities(): string[] {
    return [
      'real_time_transcription',
      'speaker_identification',
      'emotion_analysis',
      'action_item_extraction',
      'decision_tracking',
      'sentiment_analysis',
      'engagement_metrics',
      'meeting_summary',
      'productivity_scoring'
    ]
  }

  private async handleAnalysisRequest(socket: any, data: {
    meetingId: string
    analysisType: string
    userId: string
  }): Promise<void> {
    try {
      const session = this.activeMeetings.get(data.meetingId)
      if (!session) {
        socket.emit('meeting:analysis-error', { message: 'Meeting not found' })
        return
      }

      let analysisResult: any

      switch (data.analysisType) {
        case 'summary':
          analysisResult = await this.generateMeetingSummary(session)
          break
        case 'engagement':
          analysisResult = await this.calculateEngagementMetrics(session)
          break
        case 'productivity':
          analysisResult = await this.calculateProductivityScore(session)
          break
        case 'topics':
          analysisResult = await this.extractKeyTopics(session.transcription.segments)
          break
        default:
          analysisResult = session.analysis
      }

      socket.emit('meeting:analysis-result', {
        meetingId: data.meetingId,
        analysisType: data.analysisType,
        result: analysisResult
      })

    } catch (error) {
      console.error('Error handling analysis request:', error)
      socket.emit('meeting:analysis-error', { message: 'Failed to generate analysis' })
    }
  }

  private async handleStopIntelligence(socket: any, data: {
    meetingId: string
    userId: string
  }): Promise<void> {
    try {
      await this.stopMeetingIntelligence(data.meetingId)
      
      socket.emit('meeting:intelligence-stopped', {
        meetingId: data.meetingId
      })

    } catch (error) {
      console.error('Error stopping meeting intelligence:', error)
      socket.emit('meeting:intelligence-error', { message: 'Failed to stop meeting intelligence' })
    }
  }

  async stopMeetingIntelligence(meetingId: string): Promise<MeetingAnalysis | null> {
    const session = this.activeMeetings.get(meetingId)
    if (!session) return null

    session.status = 'completed'
    session.endTime = new Date()

    // Generate final analysis
    await this.updateMeetingAnalysis(meetingId)
    
    // Generate final summary
    session.analysis.summary = await this.generateMeetingSummary(session)

    // Clean up
    this.transcriptionQueue.delete(meetingId)
    
    // Persist final results
    await this.persistMeetingResults(session)

    // Remove from active meetings
    this.activeMeetings.delete(meetingId)

    this.monitoring.recordMetric('meeting_intelligence.sessions.completed', 1, { meetingId })
    
    return session.analysis
  }

  private async persistMeetingResults(session: MeetingSession): Promise<void> {
    try {
      const redis = this.redisManager.getClient()
      
      // Store meeting session
      await redis.set(
        `meeting_intelligence:${session.id}`,
        JSON.stringify({
          ...session,
          audioStreams: undefined // Don't persist audio data
        }),
        'EX',
        30 * 24 * 60 * 60 // 30 days
      )
      
      // Store transcription separately
      await redis.set(
        `meeting_transcription:${session.id}`,
        JSON.stringify(session.transcription),
        'EX',
        90 * 24 * 60 * 60 // 90 days
      )
      
      // Store analysis separately
      await redis.set(
        `meeting_analysis:${session.id}`,
        JSON.stringify(session.analysis),
        'EX',
        365 * 24 * 60 * 60 // 1 year
      )

    } catch (error) {
      console.error('Error persisting meeting results:', error)
    }
  }

  // Public API methods
  public async getMeetingAnalysis(meetingId: string): Promise<MeetingAnalysis | null> {
    // Check active meetings first
    const activeSession = this.activeMeetings.get(meetingId)
    if (activeSession) {
      return activeSession.analysis
    }

    // Check cache
    if (this.analysisCache.has(meetingId)) {
      return this.analysisCache.get(meetingId)!
    }

    // Load from Redis
    try {
      const redis = this.redisManager.getClient()
      const analysisData = await redis.get(`meeting_analysis:${meetingId}`)
      
      if (analysisData) {
        const analysis = JSON.parse(analysisData)
        this.analysisCache.set(meetingId, analysis)
        return analysis
      }
    } catch (error) {
      console.error('Error loading meeting analysis:', error)
    }

    return null
  }

  public async getMeetingTranscription(meetingId: string): Promise<RealTimeTranscription | null> {
    // Check active meetings first
    const activeSession = this.activeMeetings.get(meetingId)
    if (activeSession) {
      return activeSession.transcription
    }

    // Load from Redis
    try {
      const redis = this.redisManager.getClient()
      const transcriptionData = await redis.get(`meeting_transcription:${meetingId}`)
      
      if (transcriptionData) {
        return JSON.parse(transcriptionData)
      }
    } catch (error) {
      console.error('Error loading meeting transcription:', error)
    }

    return null
  }

  public getActiveMeetings(): string[] {
    return Array.from(this.activeMeetings.keys())
  }

  public getMeetingIntelligenceStats() {
    return {
      activeMeetings: this.activeMeetings.size,
      queuedAudioChunks: Array.from(this.transcriptionQueue.values())
        .reduce((sum, queue) => sum + queue.length, 0),
      cachedAnalyses: this.analysisCache.size,
      totalTranscriptionSegments: Array.from(this.activeMeetings.values())
        .reduce((sum, session) => sum + session.transcription.segments.length, 0)
    }
  }
}

// Audio processing types
interface AudioChunk {
  participantId: string
  audioData: ArrayBuffer
  timestamp: number
  processed: boolean
}