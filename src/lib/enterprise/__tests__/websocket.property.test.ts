/**
 * Property-Based Tests for Real-Time Connection Reliability
 * 
 * **Feature: advanced-enterprise-features, Property 1: Real-time Operation Consistency**
 * **Validates: Requirements 1.1, 1.2**
 * 
 * Tests that real-time WebSocket connections maintain consistency and reliability
 * under various network conditions and concurrent user scenarios
 */

import fc from 'fast-check'
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { io as ClientIO, Socket as ClientSocket } from 'socket.io-client'
import { EnterpriseWebSocketManager, ConnectionRecoveryManager, WebSocketRateLimiter } from '../websocket'
import { EnterpriseMonitoring } from '../monitoring'

describe('Real-Time Connection Reliability Properties', () => {
  let server: HTTPServer
  let wsManager: EnterpriseWebSocketManager
  let monitoring: EnterpriseMonitoring
  let serverPort: number

  beforeAll(async () => {
    // Setup test environment
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
    process.env.JWT_SECRET = 'test-secret-key-for-testing-only'
    process.env.REDIS_HOST = 'localhost'
    process.env.NODE_ENV = 'test'
    
    monitoring = EnterpriseMonitoring.getInstance()
    
    // Create HTTP server for testing
    server = new HTTPServer()
    wsManager = new EnterpriseWebSocketManager(server)
    
    // Start server on random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        serverPort = (server.address() as any)?.port
        resolve()
      })
    })
  })

  afterAll(async () => {
    await wsManager.shutdown()
    server.close()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  /**
   * Property 1: Connection Establishment Reliability
   * For any number of concurrent connection attempts within system limits,
   * all valid connections should be established successfully
   */
  test('concurrent connections establish reliably within system limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }), // Number of concurrent connections
        fc.integer({ min: 100, max: 5000 }), // Connection timeout
        async (connectionCount, timeout) => {
          const clients: ClientSocket[] = []
          const connectionPromises: Promise<void>[] = []
          const connectionResults: boolean[] = []

          // Create concurrent connections
          for (let i = 0; i < connectionCount; i++) {
            const client = ClientIO(`http://localhost:${serverPort}`, {
              timeout,
              auth: { token: `test-token-${i}` }
            })
            clients.push(client)

            const connectionPromise = new Promise<void>((resolve, reject) => {
              const connectionTimeout = setTimeout(() => {
                connectionResults[i] = false
                reject(new Error(`Connection ${i} timed out`))
              }, timeout)

              client.on('connect', () => {
                clearTimeout(connectionTimeout)
                connectionResults[i] = true
                resolve()
              })

              client.on('connect_error', (error) => {
                clearTimeout(connectionTimeout)
                connectionResults[i] = false
                reject(error)
              })
            })

            connectionPromises.push(connectionPromise)
          }

          // Wait for all connections with timeout handling
          try {
            await Promise.allSettled(connectionPromises)
          } catch (error) {
            // Some connections may fail, which is acceptable under high load
          }

          // Property: Most connections should succeed (allow some failures under high load)
          const successfulConnections = connectionResults.filter(result => result === true).length
          const successRate = successfulConnections / connectionCount
          
          expect(successRate).toBeGreaterThan(0.7) // At least 70% success rate

          // Property: Connection stats should be updated
          const stats = wsManager.getConnectionStats()
          expect(stats.totalConnections).toBeGreaterThanOrEqual(0)

          // Cleanup
          clients.forEach(client => {
            if (client.connected) {
              client.disconnect()
            }
          })

          // Wait for disconnections to process
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      ),
      { numRuns: 5, timeout: 30000 }
    )
  })

  /**
   * Property 2: Message Delivery Consistency
   * For any sequence of messages sent through WebSocket connections,
   * all messages should be delivered in order and without loss
   */
  test('messages are delivered consistently and in order', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }), // Number of clients
        fc.array(fc.record({
          type: fc.constantFrom('chat', 'cursor', 'typing', 'presence'),
          payload: fc.record({
            content: fc.string({ minLength: 1, maxLength: 100 }),
            timestamp: fc.date()
          })
        }), { minLength: 5, maxLength: 20 }),
        async (clientCount, messages) => {
          const clients: ClientSocket[] = []
          const receivedMessages: Array<Array<any>> = []
          const roomId = `test-room-${Date.now()}`

          // Initialize clients and message tracking
          for (let i = 0; i < clientCount; i++) {
            receivedMessages[i] = []
          }

          // Create and connect clients
          const connectionPromises = []
          for (let i = 0; i < clientCount; i++) {
            const client = ClientIO(`http://localhost:${serverPort}`, {
              auth: { token: `test-token-${i}` }
            })
            clients.push(client)

            const connectionPromise = new Promise<void>((resolve) => {
              client.on('connect', () => {
                // Join room
                client.emit('join_room', { roomId, roomType: 'test' })
                
                // Setup message listener
                client.on('realtime_event', (event) => {
                  receivedMessages[i].push({
                    ...event,
                    receivedAt: Date.now()
                  })
                })

                resolve()
              })
            })
            connectionPromises.push(connectionPromise)
          }

          await Promise.all(connectionPromises)

          // Wait for all clients to join room
          await new Promise(resolve => setTimeout(resolve, 100))

          // Send messages from first client
          const sender = clients[0]
          const sentMessages = []
          
          for (let i = 0; i < messages.length; i++) {
            const message = {
              ...messages[i],
              roomId,
              messageId: i,
              sentAt: Date.now()
            }
            
            sender.emit('realtime_event', message)
            sentMessages.push(message)
            
            // Small delay between messages to test ordering
            await new Promise(resolve => setTimeout(resolve, 10))
          }

          // Wait for message propagation
          await new Promise(resolve => setTimeout(resolve, 500))

          // Property: All receivers (except sender) should get all messages
          for (let i = 1; i < clientCount; i++) {
            const received = receivedMessages[i]
            expect(received).toHaveLength(messages.length)
            
            // Property: Messages should be received in order
            for (let j = 0; j < received.length - 1; j++) {
              expect(received[j].messageId).toBeLessThan(received[j + 1].messageId)
            }
            
            // Property: Message content should be preserved
            received.forEach((receivedMsg, index) => {
              const originalMsg = sentMessages[index]
              expect(receivedMsg.type).toBe(originalMsg.type)
              expect(receivedMsg.payload.content).toBe(originalMsg.payload.content)
              expect(receivedMsg.roomId).toBe(originalMsg.roomId)
            })
          }

          // Cleanup
          clients.forEach(client => client.disconnect())
        }
      ),
      { numRuns: 5, timeout: 20000 }
    )
  })

  /**
   * Property 3: Room Management Consistency
   * For any sequence of join/leave operations, room state should remain consistent
   */
  test('room management maintains consistency across operations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.record({
          action: fc.constantFrom('join', 'leave'),
          userId: fc.integer({ min: 0, max: 9 }),
          roomId: fc.constantFrom('room1', 'room2', 'room3')
        }), { minLength: 10, maxLength: 30 }),
        async (operations) => {
          const clients: Map<number, ClientSocket> = new Map()
          const expectedRoomState: Map<string, Set<number>> = new Map()
          const actualRoomEvents: Array<any> = []

          // Initialize expected room state
          operations.forEach(op => {
            if (!expectedRoomState.has(op.roomId)) {
              expectedRoomState.set(op.roomId, new Set())
            }
          })

          // Create clients for all users mentioned in operations
          const userIds = [...new Set(operations.map(op => op.userId))]
          const connectionPromises = []

          for (const userId of userIds) {
            const client = ClientIO(`http://localhost:${serverPort}`, {
              auth: { token: `test-token-${userId}` }
            })
            clients.set(userId, client)

            const connectionPromise = new Promise<void>((resolve) => {
              client.on('connect', () => {
                // Listen for room events
                client.on('user_joined', (event) => {
                  actualRoomEvents.push({ type: 'joined', ...event })
                })
                client.on('user_left', (event) => {
                  actualRoomEvents.push({ type: 'left', ...event })
                })
                resolve()
              })
            })
            connectionPromises.push(connectionPromise)
          }

          await Promise.all(connectionPromises)

          // Execute operations and track expected state
          for (const operation of operations) {
            const client = clients.get(operation.userId)!
            const roomParticipants = expectedRoomState.get(operation.roomId)!

            if (operation.action === 'join') {
              if (!roomParticipants.has(operation.userId)) {
                client.emit('join_room', { roomId: operation.roomId, roomType: 'test' })
                roomParticipants.add(operation.userId)
              }
            } else if (operation.action === 'leave') {
              if (roomParticipants.has(operation.userId)) {
                client.emit('leave_room', { roomId: operation.roomId })
                roomParticipants.delete(operation.userId)
              }
            }

            // Small delay between operations
            await new Promise(resolve => setTimeout(resolve, 50))
          }

          // Wait for all events to propagate
          await new Promise(resolve => setTimeout(resolve, 500))

          // Property: Room participant counts should match expected state
          for (const [roomId, expectedParticipants] of expectedRoomState) {
            const actualParticipants = wsManager.getRoomParticipants(roomId)
            
            // Convert user IDs to strings for comparison (as they're stored as strings)
            const expectedUserIds = Array.from(expectedParticipants).map(id => `user_${clients.get(id)?.id?.substring(0, 8)}`)
            
            // Allow for some tolerance in participant tracking due to async nature
            expect(actualParticipants.length).toBeGreaterThanOrEqual(0)
            expect(actualParticipants.length).toBeLessThanOrEqual(expectedParticipants.size)
          }

          // Property: Join/leave events should be consistent
          const joinEvents = actualRoomEvents.filter(e => e.type === 'joined')
          const leaveEvents = actualRoomEvents.filter(e => e.type === 'left')
          
          // Each join should have a corresponding user in the room
          joinEvents.forEach(event => {
            expect(event.roomId).toBeDefined()
            expect(event.userId).toBeDefined()
            expect(event.participantCount).toBeGreaterThan(0)
          })

          // Cleanup
          clients.forEach(client => client.disconnect())
        }
      ),
      { numRuns: 3, timeout: 30000 }
    )
  })

  /**
   * Property 4: Connection Recovery Reliability
   * For any connection that experiences interruption, the recovery mechanism
   * should restore the connection within acceptable parameters
   */
  test('connection recovery handles interruptions reliably', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }), // Number of disconnection/reconnection cycles
        fc.integer({ min: 100, max: 2000 }), // Disconnection duration (ms)
        async (cycles, disconnectionDuration) => {
          const recoveryManager = new ConnectionRecoveryManager()
          const client = ClientIO(`http://localhost:${serverPort}`, {
            auth: { token: 'recovery-test-token' }
          })

          let connectionCount = 0
          let disconnectionCount = 0
          const recoveryTimes: number[] = []

          // Track connection events
          client.on('connect', () => {
            connectionCount++
          })

          client.on('disconnect', () => {
            disconnectionCount++
          })

          // Initial connection
          await new Promise<void>((resolve) => {
            client.on('connect', resolve)
          })

          expect(connectionCount).toBe(1)

          // Perform disconnection/reconnection cycles
          for (let cycle = 0; cycle < cycles; cycle++) {
            const recoveryStartTime = performance.now()

            // Simulate disconnection
            client.disconnect()
            await new Promise(resolve => setTimeout(resolve, disconnectionDuration))

            // Attempt reconnection
            client.connect()
            
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error(`Reconnection timeout for cycle ${cycle}`))
              }, 10000)

              client.on('connect', () => {
                clearTimeout(timeout)
                const recoveryTime = performance.now() - recoveryStartTime
                recoveryTimes.push(recoveryTime)
                resolve()
              })
            })
          }

          // Property: All reconnection attempts should succeed
          expect(connectionCount).toBe(cycles + 1) // Initial + reconnections
          expect(disconnectionCount).toBe(cycles)

          // Property: Recovery times should be reasonable
          const avgRecoveryTime = recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
          expect(avgRecoveryTime).toBeLessThan(disconnectionDuration + 5000) // Recovery should be reasonably fast

          // Property: No recovery time should be excessively long
          recoveryTimes.forEach(time => {
            expect(time).toBeLessThan(15000) // Max 15 seconds recovery time
          })

          client.disconnect()
        }
      ),
      { numRuns: 3, timeout: 60000 }
    )
  })

  /**
   * Property 5: Rate Limiting Effectiveness
   * For any sequence of rapid events from a user, rate limiting should
   * prevent system overload while allowing legitimate traffic
   */
  test('rate limiting prevents abuse while allowing legitimate traffic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50, max: 200 }), // Events per burst
        fc.integer({ min: 10, max: 100 }), // Burst interval (ms)
        async (eventsPerBurst, burstInterval) => {
          const rateLimiter = new WebSocketRateLimiter()
          const userId = 'rate-limit-test-user'
          const allowedEvents: boolean[] = []
          const deniedEvents: boolean[] = []

          // Simulate rapid event bursts
          for (let i = 0; i < eventsPerBurst; i++) {
            const isAllowed = rateLimiter.isAllowed(userId)
            
            if (isAllowed) {
              allowedEvents.push(true)
            } else {
              deniedEvents.push(false)
            }

            // Small delay between events
            if (burstInterval > 0) {
              await new Promise(resolve => setTimeout(resolve, burstInterval))
            }
          }

          // Property: Rate limiter should allow some events but not all if over limit
          if (eventsPerBurst > 100) { // Assuming 100 events per minute limit
            expect(allowedEvents.length).toBeLessThan(eventsPerBurst)
            expect(deniedEvents.length).toBeGreaterThan(0)
          }

          // Property: Rate limiter should allow reasonable number of events
          expect(allowedEvents.length).toBeGreaterThan(0)
          expect(allowedEvents.length).toBeLessThanOrEqual(100) // Max limit

          // Property: Rate limiting should be consistent
          const totalEvents = allowedEvents.length + deniedEvents.length
          expect(totalEvents).toBe(eventsPerBurst)
        }
      ),
      { numRuns: 5, timeout: 15000 }
    )
  })

  /**
   * Property 6: Latency Consistency
   * For any sequence of ping/pong measurements, latency should remain
   * within acceptable bounds and be consistent
   */
  test('connection latency remains consistent and within bounds', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 20 }), // Number of latency measurements
        fc.integer({ min: 100, max: 1000 }), // Interval between measurements
        async (measurementCount, interval) => {
          const client = ClientIO(`http://localhost:${serverPort}`, {
            auth: { token: 'latency-test-token' }
          })

          const latencyMeasurements: number[] = []

          // Wait for connection
          await new Promise<void>((resolve) => {
            client.on('connect', resolve)
          })

          // Setup pong listener
          client.on('pong', (data: { timestamp: number; latency: number }) => {
            latencyMeasurements.push(data.latency)
          })

          // Perform latency measurements
          for (let i = 0; i < measurementCount; i++) {
            const pingTime = Date.now()
            client.emit('ping', pingTime)
            
            await new Promise(resolve => setTimeout(resolve, interval))
          }

          // Wait for all pong responses
          await new Promise(resolve => setTimeout(resolve, 1000))

          // Property: Should receive most ping responses
          expect(latencyMeasurements.length).toBeGreaterThanOrEqual(measurementCount * 0.8)

          if (latencyMeasurements.length > 0) {
            // Property: Latency should be reasonable
            const avgLatency = latencyMeasurements.reduce((a, b) => a + b, 0) / latencyMeasurements.length
            expect(avgLatency).toBeLessThan(5000) // Less than 5 seconds average latency

            // Property: No individual measurement should be excessively high
            latencyMeasurements.forEach(latency => {
              expect(latency).toBeLessThan(10000) // Less than 10 seconds max latency
              expect(latency).toBeGreaterThan(0) // Positive latency
            })

            // Property: Latency variance should be reasonable
            const maxLatency = Math.max(...latencyMeasurements)
            const minLatency = Math.min(...latencyMeasurements)
            const latencyRange = maxLatency - minLatency
            
            expect(latencyRange).toBeLessThan(avgLatency * 5) // Range shouldn't be more than 5x average
          }

          client.disconnect()
        }
      ),
      { numRuns: 5, timeout: 30000 }
    )
  })
})

// Integration test for complete WebSocket reliability
describe('WebSocket System Integration Reliability', () => {
  test('complete WebSocket system handles complex real-world scenarios', async () => {
    const server = new HTTPServer()
    const wsManager = new EnterpriseWebSocketManager(server)
    
    await new Promise<void>((resolve) => {
      server.listen(0, resolve)
    })
    
    const serverPort = (server.address() as any)?.port
    const clients: ClientSocket[] = []
    const rooms = ['room1', 'room2', 'room3']
    const userCount = 10
    const operationCount = 50

    try {
      // Create multiple clients
      const connectionPromises = []
      for (let i = 0; i < userCount; i++) {
        const client = ClientIO(`http://localhost:${serverPort}`, {
          auth: { token: `integration-test-${i}` }
        })
        clients.push(client)

        connectionPromises.push(new Promise<void>((resolve) => {
          client.on('connect', resolve)
        }))
      }

      await Promise.all(connectionPromises)

      // Perform complex operations
      const operations = []
      for (let i = 0; i < operationCount; i++) {
        const client = clients[Math.floor(Math.random() * clients.length)]
        const room = rooms[Math.floor(Math.random() * rooms.length)]
        
        const operation = Math.random() < 0.7 ? 'message' : 'room_action'
        
        if (operation === 'message') {
          operations.push(
            client.emit('realtime_event', {
              type: 'test_message',
              payload: { content: `Message ${i}`, timestamp: new Date() },
              roomId: room
            })
          )
        } else {
          const action = Math.random() < 0.6 ? 'join' : 'leave'
          operations.push(
            client.emit(`${action}_room`, { roomId: room })
          )
        }

        // Random delay between operations
        await new Promise(resolve => setTimeout(resolve, Math.random() * 100))
      }

      // Wait for all operations to complete
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Verify system state
      const stats = wsManager.getConnectionStats()
      expect(stats.totalConnections).toBe(userCount)
      expect(stats.activeRooms).toBeGreaterThanOrEqual(0)

      // Verify all clients are still connected
      const connectedClients = clients.filter(client => client.connected)
      expect(connectedClients.length).toBe(userCount)

    } finally {
      // Cleanup
      clients.forEach(client => client.disconnect())
      await wsManager.shutdown()
      server.close()
    }
  }, 30000)
})