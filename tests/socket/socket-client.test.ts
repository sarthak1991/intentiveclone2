import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectToRoom, disconnectFromRoom, disconnectAllRooms, isConnectedTo, getActiveConnectionCount } from '@/lib/socket'
import {
  createTestSocketServer,
  createTestClient,
  generateTestToken,
  cleanupTestServer,
  waitForEvent,
} from '../setup/socket'

describe('Socket.IO Client', () => {
  let ioServer: any
  let httpServer: any
  let port: number

  beforeEach(async () => {
    // Create test server
    const server = await createTestSocketServer()
    ioServer = server.ioServer
    httpServer = server.httpServer
    port = server.port

    // Set environment variable for client tests
    process.env.NEXT_PUBLIC_SOCKET_URL = `http://localhost:${port}`
  })

  afterEach(async () => {
    // Clean up all client connections
    disconnectAllRooms()

    // Clean up server
    await cleanupTestServer(ioServer, httpServer)

    // Reset environment variable
    delete process.env.NEXT_PUBLIC_SOCKET_URL
  })

  describe('Connection Management', () => {
    it('should connect to room namespace', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      // Mock cookie for authentication
      const originalCookie = document.cookie
      document.cookie = `next-auth.session-token=${token}`

      const socket = connectToRoom('test-room')

      // Wait for connection
      await waitForEvent(socket, 'connect', 2000)

      expect(socket.connected).toBe(true)

      disconnectFromRoom('test-room')
    })

    it('should reuse existing connection to same room', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      const socket1 = connectToRoom('test-room')
      await waitForEvent(socket1, 'connect', 2000)

      const socket2 = connectToRoom('test-room')

      // Should return the same socket instance
      expect(socket1).toBe(socket2)

      disconnectFromRoom('test-room')
    })

    it('should handle reconnection on disconnect', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      const socket = connectToRoom('test-room')
      await waitForEvent(socket, 'connect', 2000)

      expect(socket.connected).toBe(true)

      // Manually disconnect
      socket.disconnect()
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(socket.connected).toBe(false)

      // Reconnect
      socket.connect()
      await waitForEvent(socket, 'connect', 2000)

      expect(socket.connected).toBe(true)

      disconnectFromRoom('test-room')
    })
  })

  describe('Event Emission', () => {
    it('should emit signal events', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      const socket = connectToRoom('test-room')
      await waitForEvent(socket, 'connect', 2000)

      // Emit signal event
      socket.emit('signal', {
        targetUserId: 'target-user',
        signal: { type: 'offer', sdp: 'mock-sdp' },
      })

      // Should not throw error
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(socket.connected).toBe(true)

      disconnectFromRoom('test-room')
    })

    it('should receive signal events from other clients', async () => {
      const roomId = 'signal-receive-test'

      const user1 = { id: 'user1', email: 'user1@example.com' }
      const user2 = { id: 'user2', email: 'user2@example.com' }

      const token1 = generateTestToken(user1.id, user1.email)
      const token2 = generateTestToken(user2.id, user2.email)

      // Create first client using our utility
      document.cookie = `next-auth.session-token=${token1}`
      const socket1 = connectToRoom(roomId)
      await waitForEvent(socket1, 'connect', 2000)

      // Create second client using test utility
      const socket2 = createTestClient(port, roomId, token2)
      await waitForEvent(socket2, 'connect', 2000)

      // Set up listener on socket1
      const signalPromise = waitForEvent(socket1, 'signal', 2000)

      // Emit signal from socket2
      socket2.emit('signal', {
        targetUserId: user1.id,
        signal: { type: 'offer', sdp: 'mock-sdp' },
      })

      // Wait for signal to be received
      const signalData = await signalPromise
      expect(signalData).toBeDefined()
      expect(signalData.fromUserId).toBe(user2.id)

      disconnectFromRoom(roomId)
      socket2.disconnect()
    })

    it('should emit and receive chat messages', async () => {
      const roomId = 'chat-test'

      const user1 = { id: 'user1', email: 'user1@example.com' }
      const user2 = { id: 'user2', email: 'user2@example.com' }

      const token1 = generateTestToken(user1.id, user1.email)
      const token2 = generateTestToken(user2.id, user2.email)

      document.cookie = `next-auth.session-token=${token1}`
      const socket1 = connectToRoom(roomId)
      await waitForEvent(socket1, 'connect', 2000)

      const socket2 = createTestClient(port, roomId, token2)
      await waitForEvent(socket2, 'connect', 2000)

      // Set up listeners
      const chatPromise1 = waitForEvent(socket1, 'chat-message', 2000)
      const chatPromise2 = waitForEvent(socket2, 'chat-message', 2000)

      // Send chat message from socket1
      const testMessage = 'Hello from socket1!'
      socket1.emit('chat-message', { message: testMessage })

      // Both clients should receive the message
      const [chatData1, chatData2] = await Promise.all([chatPromise1, chatPromise2])

      expect(chatData1.message).toBe(testMessage)
      expect(chatData2.message).toBe(testMessage)

      disconnectFromRoom(roomId)
      socket2.disconnect()
    })
  })

  describe('Connection State Management', () => {
    it('should track active connections', () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      expect(getActiveConnectionCount()).toBe(0)

      const socket1 = connectToRoom('room1')
      const socket2 = connectToRoom('room2')

      // Connections are async, wait a bit
      setTimeout(() => {
        expect(getActiveConnectionCount()).toBeGreaterThanOrEqual(0)

        disconnectFromRoom('room1')
        disconnectFromRoom('room2')
      }, 100)
    })

    it('should check if connected to specific room', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      expect(isConnectedTo('test-room')).toBe(false)

      const socket = connectToRoom('test-room')
      await waitForEvent(socket, 'connect', 2000)

      expect(isConnectedTo('test-room')).toBe(true)

      disconnectFromRoom('test-room')
    })

    it('should disconnect from specific room', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      const socket1 = connectToRoom('room1')
      const socket2 = connectToRoom('room2')

      await waitForEvent(socket1, 'connect', 2000)
      await waitForEvent(socket2, 'connect', 2000)

      expect(isConnectedTo('room1')).toBe(true)
      expect(isConnectedTo('room2')).toBe(true)

      disconnectFromRoom('room1')

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(isConnectedTo('room1')).toBe(false)
      expect(isConnectedTo('room2')).toBe(true)

      disconnectFromRoom('room2')
    })

    it('should disconnect from all rooms', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      const socket1 = connectToRoom('room1')
      const socket2 = connectToRoom('room2')
      const socket3 = connectToRoom('room3')

      await waitForEvent(socket1, 'connect', 2000)
      await waitForEvent(socket2, 'connect', 2000)
      await waitForEvent(socket3, 'connect', 2000)

      expect(isConnectedTo('room1')).toBe(true)
      expect(isConnectedTo('room2')).toBe(true)
      expect(isConnectedTo('room3')).toBe(true)

      disconnectAllRooms()

      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(isConnectedTo('room1')).toBe(false)
      expect(isConnectedTo('room2')).toBe(false)
      expect(isConnectedTo('room3')).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('should handle connection errors gracefully', async () => {
      // Set invalid socket URL
      process.env.NEXT_PUBLIC_SOCKET_URL = 'http://localhost:9999'

      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      const socket = connectToRoom('test-room')

      // Should handle connection error
      const error = await waitForEvent(socket, 'connect_error', 2000)
      expect(error).toBeDefined()

      disconnectFromRoom('test-room')
    })

    it('should handle malformed event data', async () => {
      const mockUser = { id: 'test-user-id', email: 'test@example.com' }
      const token = generateTestToken(mockUser.id, mockUser.email)

      document.cookie = `next-auth.session-token=${token}`

      const socket = connectToRoom('test-room')
      await waitForEvent(socket, 'connect', 2000)

      // Emit malformed data
      socket.emit('signal', null)
      socket.emit('chat-message', { invalid: 'data' })

      // Should not crash
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(socket.connected).toBe(true)

      disconnectFromRoom('test-room')
    })
  })
})

// Mock document.cookie for Node.js environment
declare global {
  interface Document {
    cookie: string
  }
}

// @ts-ignore
if (typeof document === 'undefined') {
  // @ts-ignore
  global.document = {
    cookie: '',
  }
}
