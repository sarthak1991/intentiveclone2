import { createServer } from 'http'
import { Server } from 'socket.io'
import { io as ioc, Socket as ClientSocket } from 'socket.io-client'
import { AddressInfo } from 'net'
import { verify } from 'jsonwebtoken'
import { z } from 'zod'
import { connectDB } from '../../src/lib/db'
import { User } from '../../src/models/User'
import { ChatMessage } from '../../src/models/ChatMessage'

/**
 * Test configuration
 */
const TEST_PORT = 0 // Use port 0 to let the OS assign an available port
const TEST_SECRET = 'test-nextauth-secret-for-jwt-verification'

/**
 * Create a test Socket.IO server
 * @returns Configured Socket.IO server instance
 */
export async function createTestSocketServer(): Promise<{
  ioServer: Server
  httpServer: ReturnType<typeof createServer>
  port: number
}> {
  // Create HTTP server
  const httpServer = createServer()

  // Create Socket.IO server with test configuration
  const ioServer = new Server(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  })

  // Add authentication middleware (simplified for testing)
  ioServer.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      // Verify JWT token
      const decoded = verify(token, TEST_SECRET) as {
        id: string
        email: string
      }

      // Connect to database
      await connectDB()

      // Find user or create mock user for testing
      let user = await User.findById(decoded.id)

      if (!user) {
        // For testing, we allow connections with mock users
        socket.data.user = {
          id: decoded.id,
          email: decoded.email,
          name: 'Test User',
          isOnboarded: true,
        }
      } else {
        socket.data.user = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          isOnboarded: user.isOnboarded,
        }
      }

      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  // Set up room namespace
  const roomNamespace = ioServer.of(/^\/room-\w+$/)

  // Apply authentication middleware to room namespace
  roomNamespace.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      const decoded = verify(token, TEST_SECRET) as { id: string; email: string }

      await connectDB()
      let user = await User.findById(decoded.id)

      if (!user) {
        socket.data.user = {
          id: decoded.id,
          email: decoded.email,
          name: 'Test User',
          isOnboarded: true,
        }
      } else {
        socket.data.user = {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          isOnboarded: user.isOnboarded,
        }
      }

      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  roomNamespace.on('connection', (socket) => {
    const namespace = socket.nsp
    const roomId = namespace.name.replace('/room-', '')
    const user = socket.data.user

    socket.join(roomId)

    socket.on('signal', (data) => {
      if (data.targetUserId) {
        socket.to(roomId).emit('signal', {
          fromUserId: user.id,
          signal: data.signal,
        })
      }
    })

    const ChatMessageSchema = z.object({
      message: z.string().min(1).max(500)
    })

    socket.on('chat-message', async (data) => {
      try {
        const { message } = ChatMessageSchema.parse(data)

        // Rate limiting: check recent messages from this user
        const recentCount = await ChatMessage.countDocuments({
          userId: user.id,
          timestamp: { $gte: new Date(Date.now() - 60000) }
        })

        if (recentCount >= 10) {
          socket.emit('chat-error', { error: 'Rate limit exceeded. Please wait before sending another message.' })
          return
        }

        // Save to MongoDB
        const chatMessage = await ChatMessage.create({
          roomId: roomId,
          userId: user.id,
          userName: user.name,
          message: message
        })

        const payload = {
          messageId: chatMessage._id.toString(),
          userId: user.id,
          userName: user.name,
          message: message,
          timestamp: chatMessage.timestamp.toISOString()
        }

        // Broadcast to others in room and also send back to sender
        socket.to(roomId).emit('chat-message', payload)
        socket.emit('chat-message', payload)
      } catch (error) {
        if (error instanceof z.ZodError) {
          socket.emit('chat-error', { error: 'Invalid message format. Message must be 1-500 characters.' })
        } else {
          console.error('[test-socket] chat-message handler error:', error)
          socket.emit('chat-error', { error: 'Failed to send message. Please try again.' })
        }
      }
    })

    socket.on('fetch-history', async (data) => {
      try {
        const { limit = 50 } = data || {}
        const recentMessages = await ChatMessage.find({ roomId: roomId })
          .sort({ timestamp: -1 })
          .limit(limit)
          .lean()

        socket.emit('chat-history', {
          messages: recentMessages.reverse().map(msg => ({
            messageId: msg._id.toString(),
            userId: (msg.userId as any).toString(),
            userName: msg.userName,
            message: msg.message,
            timestamp: msg.timestamp.toISOString()
          }))
        })
      } catch (error) {
        socket.emit('chat-error', { error: 'Failed to load message history' })
      }
    })

    socket.on('disconnect', () => {
      socket.leave(roomId)
    })
  })

  // Start server
  await new Promise<void>((resolve) => {
    httpServer.listen(TEST_PORT, () => {
      resolve()
    })
  })

  const port = (httpServer.address() as AddressInfo).port

  return { ioServer, httpServer, port }
}

/**
 * Create a test Socket.IO client
 * @param port - Server port
 * @param roomId - Room ID to connect to
 * @param token - JWT token for authentication
 * @returns Socket.IO client instance
 */
export function createTestClient(
  port: number,
  roomId: string,
  token?: string
): ClientSocket {
  return ioc(`http://localhost:${port}/room-${roomId}`, {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: false,
  })
}

/**
 * Generate a test JWT token
 * @param userId - User ID
 * @param email - User email
 * @returns JWT token
 */
export function generateTestToken(userId: string, email: string): string {
  const jwt = require('jsonwebtoken')
  return jwt.sign(
    { id: userId, email },
    TEST_SECRET,
    { expiresIn: '1h' }
  )
}

/**
 * Clean up test server and close connections
 * @param ioServer - Socket.IO server instance
 * @param httpServer - HTTP server instance
 * @param clients - Array of client sockets to close
 */
export async function cleanupTestServer(
  ioServer: Server,
  httpServer: ReturnType<typeof createServer>,
  clients: ClientSocket[] = []
): Promise<void> {
  // Close all client connections
  await Promise.all(
    clients.map((client) => {
      if (client.connected) {
        client.disconnect()
      }
      return Promise.resolve()
    })
  )

  // Close server
  await new Promise<void>((resolve) => {
    ioServer.close(() => {
      httpServer.close(() => {
        resolve()
      })
    })
  })
}

/**
 * Wait for a socket event
 * @param socket - Socket instance
 * @param event - Event name
 * @param timeout - Timeout in milliseconds
 * @returns Promise that resolves with event data
 */
export function waitForEvent<T = any>(
  socket: ClientSocket,
  event: string,
  timeout: number = 1000
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, listener)
      reject(new Error(`Event '${event}' not received within ${timeout}ms`))
    }, timeout)

    const listener = (data: T) => {
      clearTimeout(timer)
      socket.off(event, listener)
      resolve(data)
    }

    socket.on(event, listener)
  })
}

/**
 * Create a mock user for testing
 * @param userData - User data
 * @returns Mock user object
 */
export function createMockUser(userData: Partial<{
  id: string
  email: string
  name: string
  isOnboarded: boolean
}> = {}) {
  return {
    id: userData.id || 'test-user-id',
    email: userData.email || 'test@example.com',
    name: userData.name || 'Test User',
    isOnboarded: userData.isOnboarded !== undefined ? userData.isOnboarded : true,
  }
}
