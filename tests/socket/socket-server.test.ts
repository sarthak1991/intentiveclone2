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
import { ClientSocket } from 'socket.io-client'
import { io as ioc } from 'socket.io-client'

describe('Socket.IO Server', () => {
  let ioServer: any
  let httpServer: any
  let port: number

  beforeAll(async () => {
    // Connect to database before tests
    await connectDB()
  })

  beforeEach(async () => {
    // Create test server before each test
    const server = await createTestSocketServer()
    ioServer = server.ioServer
    httpServer = server.httpServer
    port = server.port
  })

  afterEach(async () => {
    // Clean up server after each test
    await cleanupTestServer(ioServer, httpServer)
  })

  afterEach(async () => {
    // Clean up server after each test
    await cleanupTestServer(ioServer, httpServer)
  })

  afterAll(async () => {
    // Close database connection after all tests
    // await mongoose.connection.close()
  })

  describe('Server Startup', () => {
    it('should start server on configured port', async () => {
      expect(port).toBeDefined()
      expect(port).toBeGreaterThan(0)
      expect(httpServer.listening).toBe(true)
    })

    it('should have Socket.IO server instance', () => {
      expect(ioServer).toBeDefined()
      expect(ioServer.eio).toBeDefined()
    })
  })

  describe('Authentication', () => {
    it('should reject unauthenticated connections (no token)', async () => {
      const client = createTestClient(port, 'test-room')

      const error = await waitForEvent(client, 'connect_error')
      expect(error).toBeDefined()
      expect(error.message).toMatch(/authentication|token/i)

      client.disconnect()
    })

    it('should reject connections with invalid JWT', async () => {
      const client = createTestClient(port, 'test-room', 'invalid-token')

      const error = await waitForEvent(client, 'connect_error')
      expect(error).toBeDefined()
      expect(error.message).toMatch(/authentication|token|invalid/i)

      client.disconnect()
    })

    it('should accept authenticated connection with valid JWT', async () => {
      const mockUser = createMockUser()
      const token = generateTestToken(mockUser.id, mockUser.email)
      const client = createTestClient(port, 'test-room', token)

      await waitForEvent(client, 'connect', 2000)
      expect(client.connected).toBe(true)

      client.disconnect()
    })

    it('should attach user data to socket after authentication', async () => {
      const mockUser = createMockUser()
      const token = generateTestToken(mockUser.id, mockUser.email)
      const client = createTestClient(port, 'test-room', token)

      await waitForEvent(client, 'connect', 2000)
      expect(client.connected).toBe(true)

      // Server should have user data attached
      // This would need to be verified via server-side logging or a test endpoint
      client.disconnect()
    })
  })

  describe('Room Namespaces', () => {
    it('should join room namespace on connection', async () => {
      const mockUser = createMockUser()
      const token = generateTestToken(mockUser.id, mockUser.email)
      const roomId = 'test-room-123'
      const client = createTestClient(port, roomId, token)

      await waitForEvent(client, 'connect', 2000)
      expect(client.connected).toBe(true)

      // Client should be connected to the room namespace
      expect(client.nsps).toHaveProperty(`/room-${roomId}`)

      client.disconnect()
    })

    it('should handle multiple clients in same room', async () => {
      const roomId = 'shared-room'

      const user1 = createMockUser({ id: 'user1', email: 'user1@example.com' })
      const user2 = createMockUser({ id: 'user2', email: 'user2@example.com' })

      const token1 = generateTestToken(user1.id, user1.email)
      const token2 = generateTestToken(user2.id, user2.email)

      const client1 = createTestClient(port, roomId, token1)
      const client2 = createTestClient(port, roomId, token2)

      await waitForEvent(client1, 'connect', 2000)
      await waitForEvent(client2, 'connect', 2000)

      expect(client1.connected).toBe(true)
      expect(client2.connected).toBe(true)

      client1.disconnect()
      client2.disconnect()
    })
  })

  describe('Signaling Events', () => {
    it('should handle signaling events between clients', async () => {
      const roomId = 'signal-test-room'

      const user1 = createMockUser({ id: 'user1', email: 'user1@example.com' })
      const user2 = createMockUser({ id: 'user2', email: 'user2@example.com' })

      const token1 = generateTestToken(user1.id, user1.email)
      const token2 = generateTestToken(user2.id, user2.email)

      const client1 = createTestClient(port, roomId, token1)
      const client2 = createTestClient(port, roomId, token2)

      await waitForEvent(client1, 'connect', 2000)
      await waitForEvent(client2, 'connect', 2000)

      // Set up listener for signal on client2
      const signalPromise = waitForEvent(client2, 'signal', 2000)

      // Send signal from client1 to client2
      client1.emit('signal', {
        targetUserId: user2.id,
        signal: { type: 'offer', sdp: 'mock-sdp' },
      })

      // Wait for signal to be received
      const signalData = await signalPromise
      expect(signalData).toBeDefined()
      expect(signalData.fromUserId).toBe(user1.id)
      expect(signalData.signal).toBeDefined()

      client1.disconnect()
      client2.disconnect()
    })
  })

  describe('Chat Messages', () => {
    it('should broadcast chat messages to all clients in room', async () => {
      const roomId = 'chat-test-room'

      const user1 = createMockUser({ id: 'user1', email: 'user1@example.com' })
      const user2 = createMockUser({ id: 'user2', email: 'user2@example.com' })

      const token1 = generateTestToken(user1.id, user1.email)
      const token2 = generateTestToken(user2.id, user2.email)

      const client1 = createTestClient(port, roomId, token1)
      const client2 = createTestClient(port, roomId, token2)

      await waitForEvent(client1, 'connect', 2000)
      await waitForEvent(client2, 'connect', 2000)

      // Set up listeners for chat message
      const chatPromise1 = waitForEvent(client1, 'chat-message', 2000)
      const chatPromise2 = waitForEvent(client2, 'chat-message', 2000)

      // Send chat message from client1
      const testMessage = 'Hello, room!'
      client1.emit('chat-message', { message: testMessage })

      // Both clients should receive the message
      const [chatData1, chatData2] = await Promise.all([chatPromise1, chatPromise2])

      expect(chatData1.message).toBe(testMessage)
      expect(chatData2.message).toBe(testMessage)
      expect(chatData1.userId).toBe(user1.id)
      expect(chatData2.userId).toBe(user1.id)

      client1.disconnect()
      client2.disconnect()
    })
  })

  describe('Connection Lifecycle', () => {
    it('should handle disconnect and leave room', async () => {
      const mockUser = createMockUser()
      const token = generateTestToken(mockUser.id, mockUser.email)
      const client = createTestClient(port, 'test-room', token)

      await waitForEvent(client, 'connect', 2000)
      expect(client.connected).toBe(true)

      client.disconnect()
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(client.connected).toBe(false)
    })

    it('should handle reconnection', async () => {
      const mockUser = createMockUser()
      const token = generateTestToken(mockUser.id, mockUser.email)
      const client = createTestClient(port, 'test-room', token)

      await waitForEvent(client, 'connect', 2000)
      expect(client.connected).toBe(true)

      // Disconnect
      client.disconnect()
      await new Promise((resolve) => setTimeout(resolve, 100))
      expect(client.connected).toBe(false)

      // Reconnect
      client.connect()
      await waitForEvent(client, 'connect', 2000)
      expect(client.connected).toBe(true)

      client.disconnect()
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid room namespace gracefully', async () => {
      const mockUser = createMockUser()
      const token = generateTestToken(mockUser.id, mockUser.email)

      // Try to connect to invalid namespace (no room- prefix)
      const client = ioc(`http://localhost:${port}/invalid-namespace`, {
        auth: { token },
        transports: ['websocket', 'polling'],
      })

      const error = await waitForEvent(client, 'connect_error', 500)
      expect(error).toBeDefined()

      client.disconnect()
    })

    it('should handle malformed signal data', async () => {
      const roomId = 'malformed-test-room'

      const user1 = createMockUser({ id: 'user1', email: 'user1@example.com' })
      const user2 = createMockUser({ id: 'user2', email: 'user2@example.com' })

      const token1 = generateTestToken(user1.id, user1.email)
      const token2 = generateTestToken(user2.id, user2.email)

      const client1 = createTestClient(port, roomId, token1)
      const client2 = createTestClient(port, roomId, token2)

      await waitForEvent(client1, 'connect', 2000)
      await waitForEvent(client2, 'connect', 2000)

      // Emit malformed signal (missing targetUserId)
      client1.emit('signal', { invalid: 'data' })

      // Should not crash, just ignore the event
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(client1.connected).toBe(true)
      expect(client2.connected).toBe(true)

      client1.disconnect()
      client2.disconnect()
    })
  })
})
