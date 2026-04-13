import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import {
  createTestSocketServer,
  createTestClient,
  generateTestToken,
  cleanupTestServer,
  waitForEvent,
  createMockUser,
} from '../setup/socket'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Room } from '@/models/Room'
import { ChatMessage } from '@/models/ChatMessage'
import { mongoose } from '@/lib/db'

describe('Chat Integration', () => {
  let ioServer: any
  let httpServer: any
  let port: number
  let testUser: any
  let testRoom: any
  let authToken: string

  beforeAll(async () => {
    await connectDB()
  })

  beforeEach(async () => {
    // Clean up database
    await ChatMessage.deleteMany({})
    await Room.deleteMany({})
    await User.deleteMany({})

    // Create test user
    testUser = await User.create({
      email: 'chattest@example.com',
      password: 'password123',
      name: 'Chat Test User',
      timezone: 'UTC',
      interests: ['testing'],
      isOnboarded: true,
      photoUrl: 'https://example.com/photo.jpg'
    })

    // Create test room
    testRoom = await Room.create({
      scheduledTime: new Date('2026-04-07T09:00:00Z'),
      status: 'open'
    })

    // Generate auth token
    authToken = generateTestToken(testUser._id.toString(), testUser.email)

    // Create test server
    const server = await createTestSocketServer()
    ioServer = server.ioServer
    httpServer = server.httpServer
    port = server.port
  })

  afterEach(async () => {
    await cleanupTestServer(ioServer, httpServer)
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  describe('Message Sending', () => {
    it('should save message to MongoDB and broadcast to room', async () => {
      const client = createTestClient(port, testRoom._id.toString(), authToken)
      await waitForEvent(client, 'connect', 2000)

      // Send chat message
      const messageData = { message: 'Hello, room!' }
      client.emit('chat-message', messageData)

      // Wait for broadcast
      const broadcast = await waitForEvent(client, 'chat-message', 2000)
      expect(broadcast).toBeDefined()
      expect(broadcast.message).toBe('Hello, room!')
      expect(broadcast.userId).toBe(testUser._id.toString())
      expect(broadcast.userName).toBe(testUser.name)
      expect(broadcast.messageId).toBeDefined()
      expect(broadcast.timestamp).toBeDefined()

      // Verify message was saved to MongoDB
      const savedMessage = await ChatMessage.findOne({ roomId: testRoom._id })
      expect(savedMessage).toBeDefined()
      expect(savedMessage?.message).toBe('Hello, room!')
      expect(savedMessage?.userId).toEqual(testUser._id)

      client.disconnect()
    })

    it('should reject empty messages', async () => {
      const client = createTestClient(port, testRoom._id.toString(), authToken)
      await waitForEvent(client, 'connect', 2000)

      // Send empty message
      client.emit('chat-message', { message: '' })

      // Wait for error
      const error = await waitForEvent(client, 'chat-error', 2000)
      expect(error).toBeDefined()
      expect(error.error).toMatch(/invalid message format|1-500 characters/i)

      // Verify no message was saved
      const count = await ChatMessage.countDocuments({ roomId: testRoom._id })
      expect(count).toBe(0)

      client.disconnect()
    })

    it('should reject messages longer than 500 characters', async () => {
      const client = createTestClient(port, testRoom._id.toString(), authToken)
      await waitForEvent(client, 'connect', 2000)

      // Send message that's too long
      const longMessage = 'a'.repeat(501)
      client.emit('chat-message', { message: longMessage })

      // Wait for error
      const error = await waitForEvent(client, 'chat-error', 2000)
      expect(error).toBeDefined()
      expect(error.error).toMatch(/invalid message format|1-500 characters/i)

      // Verify no message was saved
      const count = await ChatMessage.countDocuments({ roomId: testRoom._id })
      expect(count).toBe(0)

      client.disconnect()
    })

    it('should accept message with exactly 500 characters', async () => {
      const client = createTestClient(port, testRoom._id.toString(), authToken)
      await waitForEvent(client, 'connect', 2000)

      // Send message that's exactly 500 characters
      const maxMessage = 'a'.repeat(500)
      client.emit('chat-message', { message: maxMessage })

      // Wait for broadcast
      const broadcast = await waitForEvent(client, 'chat-message', 2000)
      expect(broadcast).toBeDefined()
      expect(broadcast.message).toHaveLength(500)

      // Verify message was saved
      const savedMessage = await ChatMessage.findOne({ roomId: testRoom._id })
      expect(savedMessage?.message).toHaveLength(500)

      client.disconnect()
    })
  })

  describe('Message History', () => {
    beforeEach(async () => {
      // Create some test messages
      for (let i = 0; i < 5; i++) {
        await ChatMessage.create({
          roomId: testRoom._id,
          userId: testUser._id,
          userName: testUser.name,
          userPhoto: testUser.photoUrl,
          message: `Message ${i}`,
          timestamp: new Date(Date.now() - (5 - i) * 1000) // Stagger timestamps
        })
      }
    })

    it('should return recent messages in chronological order', async () => {
      const client = createTestClient(port, testRoom._id.toString(), authToken)
      await waitForEvent(client, 'connect', 2000)

      // Fetch history
      client.emit('fetch-history', { limit: 50 })

      // Wait for history response
      const history = await waitForEvent(client, 'chat-history', 2000)
      expect(history).toBeDefined()
      expect(history.messages).toBeDefined()
      expect(history.messages).toHaveLength(5)

      // Verify chronological order (oldest first)
      expect(history.messages[0].message).toBe('Message 0')
      expect(history.messages[4].message).toBe('Message 4')

      client.disconnect()
    })

    it('should respect limit parameter', async () => {
      const client = createTestClient(port, testRoom._id.toString(), authToken)
      await waitForEvent(client, 'connect', 2000)

      // Fetch only 3 messages
      client.emit('fetch-history', { limit: 3 })

      // Wait for history response
      const history = await waitForEvent(client, 'chat-history', 2000)
      expect(history.messages).toHaveLength(3)

      client.disconnect()
    })

    it('should default to 50 messages if no limit provided', async () => {
      const client = createTestClient(port, testRoom._id.toString(), authToken)
      await waitForEvent(client, 'connect', 2000)

      // Fetch without specifying limit
      client.emit('fetch-history', {})

      // Wait for history response
      const history = await waitForEvent(client, 'chat-history', 2000)
      expect(history.messages).toBeDefined()
      expect(history.messages.length).toBeLessThanOrEqual(50)

      client.disconnect()
    })
  })

  describe('Multi-User Chat', () => {
    it('should broadcast messages to all users in room', async () => {
      // Create second user
      const user2 = await User.create({
        email: 'user2@example.com',
        password: 'password123',
        name: 'User 2',
        timezone: 'UTC',
        interests: [],
        isOnboarded: true
      })

      const token2 = generateTestToken(user2._id.toString(), user2.email)

      // Connect both users
      const client1 = createTestClient(port, testRoom._id.toString(), authToken)
      const client2 = createTestClient(port, testRoom._id.toString(), token2)

      await waitForEvent(client1, 'connect', 2000)
      await waitForEvent(client2, 'connect', 2000)

      // Register both listeners before emitting to avoid race condition
      const [broadcast1, broadcast2] = await Promise.all([
        waitForEvent(client1, 'chat-message', 2000),
        waitForEvent(client2, 'chat-message', 2000),
        Promise.resolve().then(() => client1.emit('chat-message', { message: 'Hello from user 1!' }))
      ])

      expect(broadcast1.message).toBe('Hello from user 1!')
      expect(broadcast2.message).toBe('Hello from user 1!')
      expect(broadcast1.userId).toBe(testUser._id.toString())

      client1.disconnect()
      client2.disconnect()
    })

    it('should not broadcast messages to users in different rooms', async () => {
      // Create second room
      const room2 = await Room.create({
        scheduledTime: new Date('2026-04-07T10:00:00Z'),
        status: 'open'
      })

      // Connect users to different rooms
      const client1 = createTestClient(port, testRoom._id.toString(), authToken)
      const client2 = createTestClient(port, room2._id.toString(), authToken)

      await Promise.all([
        waitForEvent(client1, 'connect', 2000),
        waitForEvent(client2, 'connect', 2000),
      ])

      // Register listener before emitting to avoid race condition
      const broadcast1Promise = waitForEvent(client1, 'chat-message', 2000)
      client1.emit('chat-message', { message: 'Message for room 1' })

      // User 1 should receive the broadcast
      const broadcast1 = await broadcast1Promise
      expect(broadcast1.message).toBe('Message for room 1')

      // User 2 should NOT receive the message (different room)
      const timeout = await Promise.race([
        waitForEvent(client2, 'chat-message', 1000).catch(() => 'timeout'),
        new Promise(resolve => setTimeout(() => resolve('timeout'), 1100))
      ])

      expect(timeout).toBe('timeout')

      client1.disconnect()
      client2.disconnect()
    })
  })
})
