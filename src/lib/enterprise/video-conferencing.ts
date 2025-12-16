// Enterprise Video Conferencing with WebRTC
import { EnterpriseWebSocketManager } from './websocket'
import { EnterpriseMonitoring } from './monitoring'
import { RedisManager } from './infrastructure'

// WebRTC Configuration
export interface RTCConfiguration {
  iceServers: RTCIceServer[]
  iceCandidatePoolSize: number
  bundlePolicy: RTCBundlePolicy
  rtcpMuxPolicy: RTCRtcpMuxPolicy
}

// Meeting Interfaces
export interface Meeting {
  id: string
  title: string
  hostId: string
  participants: Map<string, Participant>
  startTime: Date
  endTime?: Date
  status: 'waiting' | 'active' | 'ended'
  settings: MeetingSettings
  recording?: RecordingInfo
  metadata: Record<string, any>
}

export interface Participant {
  userId: string
  displayName: string
  role: 'host' | 'moderator' | 'participant'
  status: 'connecting' | 'connected' | 'disconnected'
  audioEnabled: boolean
  videoEnabled: boolean
  screenSharing: boolean
  joinedAt: Date
  lastActivity: Date
  connection?: RTCPeerConnection
  streams: MediaStream[]
}

export interface MeetingSettings {
  maxParticipants: number
  allowScreenShare: boolean
  allowRecording: boolean
  requireModerator: boolean
  muteOnJoin: boolean
  waitingRoom: boolean
  endToEndEncryption: boolean
}

export interface RecordingInfo {
  id: string
  status: 'recording' | 'processing' | 'completed' | 'failed'
  startTime: Date
  endTime?: Date
  duration?: number
  fileUrl?: string
  transcription?: string
}

// WebRTC Signaling Messages
export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join' | 'leave' | 'mute' | 'unmute'
  from: string
  to?: string
  meetingId: string
  payload: any
  timestamp: Date
}

// Video Quality Settings
export interface VideoQualitySettings {
  resolution: '720p' | '1080p' | '4k'
  frameRate: 15 | 30 | 60
  bitrate: number
  adaptiveBitrate: boolean
}

// Enterprise Video Conferencing Manager
export class VideoConferencingManager {
  private meetings: Map<string, Meeting> = new Map()
  private websocketManager: EnterpriseWebSocketManager
  private redisManager: RedisManager
  private monitoring: EnterpriseMonitoring
  private rtcConfiguration: RTCConfiguration

  constructor(websocketManager: EnterpriseWebSocketManager) {
    this.websocketManager = websocketManager
    this.redisManager = RedisManager.getInstance()
    this.monitoring = EnterpriseMonitoring.getInstance()
    
    this.rtcConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        // Add TURN servers for enterprise deployment
        {
          urls: 'turn:your-turn-server.com:3478',
          username: process.env.TURN_USERNAME || '',
          credential: process.env.TURN_PASSWORD || ''
        }
      ],
      iceCandidatePoolSize: 10,
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require'
    }

    this.setupEventHandlers()
    this.startMeetingCleanup()
  }

  private setupEventHandlers(): void {
    this.websocketManager.getSocketIO().on('connection', (socket) => {
      // Meeting management events
      socket.on('meeting:create', (data) => this.handleCreateMeeting(socket, data))
      socket.on('meeting:join', (data) => this.handleJoinMeeting(socket, data))
      socket.on('meeting:leave', (data) => this.handleLeaveMeeting(socket, data))
      socket.on('meeting:end', (data) => this.handleEndMeeting(socket, data))
      
      // WebRTC signaling events
      socket.on('webrtc:offer', (data) => this.handleWebRTCOffer(socket, data))
      socket.on('webrtc:answer', (data) => this.handleWebRTCAnswer(socket, data))
      socket.on('webrtc:ice-candidate', (data) => this.handleICECandidate(socket, data))
      
      // Media control events
      socket.on('media:toggle-audio', (data) => this.handleToggleAudio(socket, data))
      socket.on('media:toggle-video', (data) => this.handleToggleVideo(socket, data))
      socket.on('media:start-screen-share', (data) => this.handleStartScreenShare(socket, data))
      socket.on('media:stop-screen-share', (data) => this.handleStopScreenShare(socket, data))
      
      // Recording events
      socket.on('recording:start', (data) => this.handleStartRecording(socket, data))
      socket.on('recording:stop', (data) => this.handleStopRecording(socket, data))
      
      // Quality control events
      socket.on('quality:change', (data) => this.handleQualityChange(socket, data))
      socket.on('quality:report', (data) => this.handleQualityReport(socket, data))
    })
  }

  async createMeeting(
    hostId: string, 
    title: string, 
    settings: Partial<MeetingSettings> = {}
  ): Promise<Meeting> {
    const meetingId = this.generateMeetingId()
    
    const defaultSettings: MeetingSettings = {
      maxParticipants: 100,
      allowScreenShare: true,
      allowRecording: true,
      requireModerator: false,
      muteOnJoin: true,
      waitingRoom: false,
      endToEndEncryption: false
    }

    const meeting: Meeting = {
      id: meetingId,
      title,
      hostId,
      participants: new Map(),
      startTime: new Date(),
      status: 'waiting',
      settings: { ...defaultSettings, ...settings },
      metadata: {
        createdAt: new Date(),
        maxConcurrentParticipants: 0
      }
    }

    this.meetings.set(meetingId, meeting)
    await this.persistMeeting(meeting)

    this.monitoring.recordMetric('video.meetings.created', 1, { hostId })
    return meeting
  }

  private async handleCreateMeeting(socket: any, data: { 
    title: string
    settings?: Partial<MeetingSettings>
    userId: string 
  }): Promise<void> {
    try {
      const meeting = await this.createMeeting(data.userId, data.title, data.settings)
      
      socket.emit('meeting:created', {
        meetingId: meeting.id,
        title: meeting.title,
        settings: meeting.settings
      })

    } catch (error) {
      console.error('Error creating meeting:', error)
      socket.emit('meeting:error', { message: 'Failed to create meeting' })
    }
  }

  private async handleJoinMeeting(socket: any, data: {
    meetingId: string
    userId: string
    displayName: string
    audioEnabled?: boolean
    videoEnabled?: boolean
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) {
        socket.emit('meeting:error', { message: 'Meeting not found' })
        return
      }

      if (meeting.status === 'ended') {
        socket.emit('meeting:error', { message: 'Meeting has ended' })
        return
      }

      if (meeting.participants.size >= meeting.settings.maxParticipants) {
        socket.emit('meeting:error', { message: 'Meeting is full' })
        return
      }

      // Create participant
      const participant: Participant = {
        userId: data.userId,
        displayName: data.displayName,
        role: data.userId === meeting.hostId ? 'host' : 'participant',
        status: 'connecting',
        audioEnabled: data.audioEnabled ?? !meeting.settings.muteOnJoin,
        videoEnabled: data.videoEnabled ?? true,
        screenSharing: false,
        joinedAt: new Date(),
        lastActivity: new Date(),
        streams: []
      }

      meeting.participants.set(data.userId, participant)
      
      // Update meeting status
      if (meeting.status === 'waiting') {
        meeting.status = 'active'
      }

      // Update max concurrent participants
      if (meeting.participants.size > meeting.metadata.maxConcurrentParticipants) {
        meeting.metadata.maxConcurrentParticipants = meeting.participants.size
      }

      // Join socket room
      await socket.join(`meeting:${data.meetingId}`)

      // Send meeting state to new participant
      socket.emit('meeting:joined', {
        meetingId: data.meetingId,
        participants: Array.from(meeting.participants.values()).map(p => ({
          userId: p.userId,
          displayName: p.displayName,
          role: p.role,
          audioEnabled: p.audioEnabled,
          videoEnabled: p.videoEnabled,
          screenSharing: p.screenSharing
        })),
        settings: meeting.settings,
        rtcConfiguration: this.rtcConfiguration
      })

      // Notify other participants
      socket.to(`meeting:${data.meetingId}`).emit('participant:joined', {
        participant: {
          userId: participant.userId,
          displayName: participant.displayName,
          role: participant.role,
          audioEnabled: participant.audioEnabled,
          videoEnabled: participant.videoEnabled
        }
      })

      await this.persistMeeting(meeting)
      this.monitoring.recordMetric('video.participants.joined', 1, { meetingId: data.meetingId })

    } catch (error) {
      console.error('Error joining meeting:', error)
      socket.emit('meeting:error', { message: 'Failed to join meeting' })
    }
  }

  private async handleLeaveMeeting(socket: any, data: {
    meetingId: string
    userId: string
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      const participant = meeting.participants.get(data.userId)
      if (!participant) return

      // Clean up participant's connections
      if (participant.connection) {
        participant.connection.close()
      }

      // Remove participant
      meeting.participants.delete(data.userId)

      // Leave socket room
      await socket.leave(`meeting:${data.meetingId}`)

      // Notify other participants
      socket.to(`meeting:${data.meetingId}`).emit('participant:left', {
        userId: data.userId
      })

      // End meeting if host left and no other participants
      if (participant.role === 'host' && meeting.participants.size === 0) {
        meeting.status = 'ended'
        meeting.endTime = new Date()
      }

      await this.persistMeeting(meeting)
      this.monitoring.recordMetric('video.participants.left', 1, { meetingId: data.meetingId })

    } catch (error) {
      console.error('Error leaving meeting:', error)
    }
  }

  private async handleEndMeeting(socket: any, data: {
    meetingId: string
    userId: string
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      const participant = meeting.participants.get(data.userId)
      if (!participant || participant.role !== 'host') {
        socket.emit('meeting:error', { message: 'Only host can end meeting' })
        return
      }

      // End meeting
      meeting.status = 'ended'
      meeting.endTime = new Date()

      // Close all connections
      for (const [userId, participant] of meeting.participants) {
        if (participant.connection) {
          participant.connection.close()
        }
      }

      // Notify all participants
      this.websocketManager.broadcastToRoom(`meeting:${data.meetingId}`, 'meeting:ended', {
        meetingId: data.meetingId,
        endedBy: data.userId
      })

      // Stop recording if active
      if (meeting.recording && meeting.recording.status === 'recording') {
        await this.stopRecording(data.meetingId)
      }

      await this.persistMeeting(meeting)
      this.monitoring.recordMetric('video.meetings.ended', 1, { meetingId: data.meetingId })

    } catch (error) {
      console.error('Error ending meeting:', error)
      socket.emit('meeting:error', { message: 'Failed to end meeting' })
    }
  }

  private async handleWebRTCOffer(socket: any, data: {
    meetingId: string
    from: string
    to: string
    offer: RTCSessionDescriptionInit
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      // Forward offer to target participant
      socket.to(`meeting:${data.meetingId}`).emit('webrtc:offer', {
        from: data.from,
        to: data.to,
        offer: data.offer
      })

      this.monitoring.recordMetric('video.webrtc.offers', 1, { meetingId: data.meetingId })

    } catch (error) {
      console.error('Error handling WebRTC offer:', error)
    }
  }

  private async handleWebRTCAnswer(socket: any, data: {
    meetingId: string
    from: string
    to: string
    answer: RTCSessionDescriptionInit
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      // Forward answer to target participant
      socket.to(`meeting:${data.meetingId}`).emit('webrtc:answer', {
        from: data.from,
        to: data.to,
        answer: data.answer
      })

      this.monitoring.recordMetric('video.webrtc.answers', 1, { meetingId: data.meetingId })

    } catch (error) {
      console.error('Error handling WebRTC answer:', error)
    }
  }

  private async handleICECandidate(socket: any, data: {
    meetingId: string
    from: string
    to: string
    candidate: RTCIceCandidateInit
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      // Forward ICE candidate to target participant
      socket.to(`meeting:${data.meetingId}`).emit('webrtc:ice-candidate', {
        from: data.from,
        to: data.to,
        candidate: data.candidate
      })

      this.monitoring.recordMetric('video.webrtc.ice_candidates', 1, { meetingId: data.meetingId })

    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  private async handleToggleAudio(socket: any, data: {
    meetingId: string
    userId: string
    enabled: boolean
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      const participant = meeting.participants.get(data.userId)
      if (!participant) return

      participant.audioEnabled = data.enabled
      participant.lastActivity = new Date()

      // Notify other participants
      socket.to(`meeting:${data.meetingId}`).emit('participant:audio-toggle', {
        userId: data.userId,
        enabled: data.enabled
      })

      this.monitoring.recordMetric('video.audio.toggles', 1, { 
        meetingId: data.meetingId,
        enabled: data.enabled 
      })

    } catch (error) {
      console.error('Error toggling audio:', error)
    }
  }

  private async handleToggleVideo(socket: any, data: {
    meetingId: string
    userId: string
    enabled: boolean
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      const participant = meeting.participants.get(data.userId)
      if (!participant) return

      participant.videoEnabled = data.enabled
      participant.lastActivity = new Date()

      // Notify other participants
      socket.to(`meeting:${data.meetingId}`).emit('participant:video-toggle', {
        userId: data.userId,
        enabled: data.enabled
      })

      this.monitoring.recordMetric('video.video.toggles', 1, { 
        meetingId: data.meetingId,
        enabled: data.enabled 
      })

    } catch (error) {
      console.error('Error toggling video:', error)
    }
  }

  private async handleStartScreenShare(socket: any, data: {
    meetingId: string
    userId: string
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting || !meeting.settings.allowScreenShare) return

      const participant = meeting.participants.get(data.userId)
      if (!participant) return

      // Check if someone else is already screen sharing
      const existingScreenShare = Array.from(meeting.participants.values())
        .find(p => p.screenSharing && p.userId !== data.userId)

      if (existingScreenShare) {
        socket.emit('meeting:error', { message: 'Someone else is already screen sharing' })
        return
      }

      participant.screenSharing = true
      participant.lastActivity = new Date()

      // Notify other participants
      socket.to(`meeting:${data.meetingId}`).emit('screen-share:started', {
        userId: data.userId
      })

      this.monitoring.recordMetric('video.screen_share.started', 1, { meetingId: data.meetingId })

    } catch (error) {
      console.error('Error starting screen share:', error)
    }
  }

  private async handleStopScreenShare(socket: any, data: {
    meetingId: string
    userId: string
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      const participant = meeting.participants.get(data.userId)
      if (!participant) return

      participant.screenSharing = false
      participant.lastActivity = new Date()

      // Notify other participants
      socket.to(`meeting:${data.meetingId}`).emit('screen-share:stopped', {
        userId: data.userId
      })

      this.monitoring.recordMetric('video.screen_share.stopped', 1, { meetingId: data.meetingId })

    } catch (error) {
      console.error('Error stopping screen share:', error)
    }
  }

  private async handleStartRecording(socket: any, data: {
    meetingId: string
    userId: string
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting || !meeting.settings.allowRecording) return

      const participant = meeting.participants.get(data.userId)
      if (!participant || participant.role !== 'host') {
        socket.emit('meeting:error', { message: 'Only host can start recording' })
        return
      }

      if (meeting.recording && meeting.recording.status === 'recording') {
        socket.emit('meeting:error', { message: 'Recording already in progress' })
        return
      }

      await this.startRecording(data.meetingId)

      // Notify all participants
      this.websocketManager.broadcastToRoom(`meeting:${data.meetingId}`, 'recording:started', {
        meetingId: data.meetingId,
        startedBy: data.userId
      })

    } catch (error) {
      console.error('Error starting recording:', error)
      socket.emit('meeting:error', { message: 'Failed to start recording' })
    }
  }

  private async handleStopRecording(socket: any, data: {
    meetingId: string
    userId: string
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      const participant = meeting.participants.get(data.userId)
      if (!participant || participant.role !== 'host') {
        socket.emit('meeting:error', { message: 'Only host can stop recording' })
        return
      }

      await this.stopRecording(data.meetingId)

      // Notify all participants
      this.websocketManager.broadcastToRoom(`meeting:${data.meetingId}`, 'recording:stopped', {
        meetingId: data.meetingId,
        stoppedBy: data.userId
      })

    } catch (error) {
      console.error('Error stopping recording:', error)
      socket.emit('meeting:error', { message: 'Failed to stop recording' })
    }
  }

  private async handleQualityChange(socket: any, data: {
    meetingId: string
    userId: string
    quality: VideoQualitySettings
  }): Promise<void> {
    try {
      const meeting = this.meetings.get(data.meetingId)
      if (!meeting) return

      const participant = meeting.participants.get(data.userId)
      if (!participant) return

      // Store quality settings in participant metadata
      participant.lastActivity = new Date()

      // Notify other participants about quality change
      socket.to(`meeting:${data.meetingId}`).emit('participant:quality-change', {
        userId: data.userId,
        quality: data.quality
      })

      this.monitoring.recordMetric('video.quality.changes', 1, { 
        meetingId: data.meetingId,
        resolution: data.quality.resolution 
      })

    } catch (error) {
      console.error('Error handling quality change:', error)
    }
  }

  private async handleQualityReport(socket: any, data: {
    meetingId: string
    userId: string
    report: {
      bitrate: number
      packetLoss: number
      latency: number
      jitter: number
    }
  }): Promise<void> {
    try {
      // Record quality metrics
      this.monitoring.recordMetric('video.quality.bitrate', data.report.bitrate, { 
        meetingId: data.meetingId,
        userId: data.userId 
      })
      this.monitoring.recordMetric('video.quality.packet_loss', data.report.packetLoss, { 
        meetingId: data.meetingId,
        userId: data.userId 
      })
      this.monitoring.recordMetric('video.quality.latency', data.report.latency, { 
        meetingId: data.meetingId,
        userId: data.userId 
      })
      this.monitoring.recordMetric('video.quality.jitter', data.report.jitter, { 
        meetingId: data.meetingId,
        userId: data.userId 
      })

    } catch (error) {
      console.error('Error handling quality report:', error)
    }
  }

  private async startRecording(meetingId: string): Promise<void> {
    const meeting = this.meetings.get(meetingId)
    if (!meeting) return

    const recordingId = `rec_${meetingId}_${Date.now()}`
    
    meeting.recording = {
      id: recordingId,
      status: 'recording',
      startTime: new Date()
    }

    // Here you would integrate with your recording service
    // For example: AWS Kinesis Video Streams, Agora Cloud Recording, etc.
    
    this.monitoring.recordMetric('video.recordings.started', 1, { meetingId })
  }

  private async stopRecording(meetingId: string): Promise<void> {
    const meeting = this.meetings.get(meetingId)
    if (!meeting || !meeting.recording) return

    meeting.recording.status = 'processing'
    meeting.recording.endTime = new Date()
    meeting.recording.duration = meeting.recording.endTime.getTime() - meeting.recording.startTime.getTime()

    // Here you would stop the recording service and process the file
    
    this.monitoring.recordMetric('video.recordings.stopped', 1, { meetingId })
  }

  private generateMeetingId(): string {
    return `meet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async persistMeeting(meeting: Meeting): Promise<void> {
    try {
      const redis = this.redisManager.getClient()
      const key = `meeting:${meeting.id}`
      
      const meetingData = {
        ...meeting,
        participants: Array.from(meeting.participants.entries()).map(([userId, participant]) => ({
          userId,
          ...participant,
          connection: undefined, // Don't serialize connection
          streams: [] // Don't serialize streams
        }))
      }

      await redis.set(key, JSON.stringify(meetingData))
      await redis.expire(key, 7 * 24 * 60 * 60) // 7 days

    } catch (error) {
      console.error('Error persisting meeting:', error)
    }
  }

  private startMeetingCleanup(): void {
    // Clean up ended meetings every hour
    setInterval(() => {
      const now = Date.now()
      const oneHourAgo = now - (60 * 60 * 1000)

      for (const [meetingId, meeting] of this.meetings) {
        if (meeting.status === 'ended' && 
            meeting.endTime && 
            meeting.endTime.getTime() < oneHourAgo) {
          this.meetings.delete(meetingId)
        }
      }
    }, 60 * 60 * 1000) // Every hour
  }

  // Public API methods
  public getMeeting(meetingId: string): Meeting | null {
    return this.meetings.get(meetingId) || null
  }

  public getActiveMeetings(): Meeting[] {
    return Array.from(this.meetings.values()).filter(m => m.status === 'active')
  }

  public getMeetingStats() {
    const meetings = Array.from(this.meetings.values())
    return {
      total: meetings.length,
      active: meetings.filter(m => m.status === 'active').length,
      waiting: meetings.filter(m => m.status === 'waiting').length,
      ended: meetings.filter(m => m.status === 'ended').length,
      totalParticipants: meetings.reduce((sum, m) => sum + m.participants.size, 0),
      recordingActive: meetings.filter(m => m.recording?.status === 'recording').length
    }
  }
}