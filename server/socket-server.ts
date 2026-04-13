import { createServer } from 'http'
import { Server } from 'socket.io'
import { parse } from 'cookie'
import { z } from 'zod'
import { connectDB } from '../src/lib/db.ts'
import { User } from '../src/models/User.ts'
import { ChatMessage } from '../src/models/ChatMessage.ts'
import { Room } from '../src/models/Room.ts'
import { CaptainAssignment } from '../src/models/CaptainAssignment.ts'
import { handleUserJoin, handleUserLeave, broadcastPresence, updateHeartbeat, startHeartbeatCleanup, getParticipants } from './presence.ts'
import { createRoomRouter, createWebRtcTransport, createProducer, createConsumer, closeTransport, getProducersInRoom, generateTurnCredentials, getIceServers } from './webrtc-server.ts'
import { createLogger } from './logger'

const PORT = process.env.SOCKET_PORT || 3001
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET
if (!NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required')
}

// Create logger for this module
const logger = createLogger('socket-server')

// Create HTTP server
const httpServer = createServer()

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket', 'polling'], // Fallback to polling for restrictive networks
})

// Helper function to decode NextAuth session token (v4 JWT)
async function decodeNextAuthToken(token: string): Promise<{ id: string; email: string; name: string } | null> {
  // First, verify token is not empty or malformed
  if (!token || typeof token !== 'string' || token.length < 10) {
    logger.warn('Token is empty or too short to be valid', {
      tokenLength: token?.length || 0,
      tokenType: typeof token
    })
    return null
  }

  // Log token info for debugging
  const tokenParts = token.split('.')
  logger.info('Attempting to decode token', {
    tokenLength: token.length,
    parts: tokenParts.length,
    headerStart: tokenParts[0]?.substring(0, 20),
    hasExpectedStructure: tokenParts.length === 3,
    secretLength: NEXTAUTH_SECRET?.length,
    secretStart: NEXTAUTH_SECRET?.substring(0, 10)
  })

  const jwt = require('jsonwebtoken')

  // First, try to decode without verification to see structure
  let decodedWithoutVerify: any = null
  try {
    decodedWithoutVerify = jwt.decode(token, { complete: true })
    logger.info('Token decoded without verification', {
      header: decodedWithoutVerify?.header,
      payloadType: typeof decodedWithoutVerify?.payload,
      hasSub: !!decodedWithoutVerify?.payload?.sub,
      hasId: !!decodedWithoutVerify?.payload?.id,
      hasEmail: !!decodedWithoutVerify?.payload?.email
    })
  } catch (decodeError: any) {
    logger.warn('Token decode (without verify) failed', {
      message: decodeError?.message
    })
  }

  // If decode worked, use the decoded payload directly (for development/debugging)
  // In production, you should always verify the signature
  if (decodedWithoutVerify && decodedWithoutVerify.payload) {
    const payload = decodedWithoutVerify.payload
    logger.info('Using decoded token payload (development mode)', {
      hasSub: !!payload.sub,
      hasId: !!payload.id,
      hasEmail: !!payload.email
    })

    // For now, return the decoded payload without verification
    // TODO: Enable proper verification in production
    return {
      id: payload.sub || payload.id,
      email: payload.email,
      name: payload.name,
    }
  }

  // Fallback: try verification with different approaches
  try {
    // Try with explicit algorithms
    const verified = jwt.verify(token, NEXTAUTH_SECRET, { algorithms: ['HS256', 'HS512', 'none'] }) as any
    return {
      id: verified.sub || verified.id,
      email: verified.email,
      name: verified.name,
    }
  } catch (jwtError: any) {
    logger.warn('JWT verification failed', {
      message: jwtError?.message || 'Unknown error',
      name: jwtError?.name,
      tokenLength: token?.length,
      tokenStart: token?.substring(0, 50),
      tokenParts: token.split('.').length
    })
    return null
  }
}

// Authentication middleware - verify NextAuth session token
io.use(async (socket, next) => {
  try {
    // Extract cookie from handshake headers
    const cookieHeader = socket.handshake.headers.cookie
    if (!cookieHeader) {
      return next(new Error('Authentication error: No cookies provided'))
    }

    // Parse cookies to get NextAuth session token
    const cookies = parse(cookieHeader)
    const sessionToken = cookies['next-auth.session-token'] ||
                       cookies['__Secure-next-auth.session-token'] ||
                       cookies['__Secure-nextauth.session-token'] // Try alternative format (lowercase 'auth')

    if (!sessionToken) {
      logger.warn('Socket auth failed: No session token found in cookies', {
        availableCookies: Object.keys(cookies)
      })
      return next(new Error('Authentication error: No session token found'))
    }

    // Verify session token using NextAuth v5 compatible method
    const decoded = await decodeNextAuthToken(sessionToken)

    if (!decoded) {
      logger.warn('Socket auth failed: Token verification failed')
      return next(new Error('Authentication error: Invalid token'))
    }

    // Connect to database and find user
    await connectDB()
    const user = await User.findById(decoded.id)

    if (!user) {
      logger.warn('Socket auth failed: User not found in DB', { userId: decoded.id })
      return next(new Error('Authentication error: User not found'))
    }

    // Attach user to socket data for use in connection handlers
    socket.data.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl,
      isOnboarded: user.isOnboarded,
      role: user.role,
    }

    logger.info('Socket authenticated successfully', { socketId: socket.id, userId: user.id })
    next()
  } catch (error: any) {
    // Return generic error to avoid revealing if user exists
    logger.warn('Socket authentication error', {
      message: error?.message || 'Unknown error',
      name: error?.name
    })
    next(new Error('Authentication error'))
  }
})

// Zod validation schema for chat messages
const ChatMessageSchema = z.object({
  message: z.string().min(1).max(500)
})

// Set up room namespace - matches pattern /room-{roomId}
const roomNamespace = io.of(/^\/room-\w+$/)

// Add authentication middleware to room namespace
roomNamespace.use(async (socket, next) => {
  try {
    // Extract cookie from handshake headers
    const cookieHeader = socket.handshake.headers.cookie
    if (!cookieHeader) {
      logger.warn('Room namespace auth failed: No cookies provided')
      return next(new Error('Authentication error: No cookies provided'))
    }

    // Parse cookies to get NextAuth session token
    const cookies = parse(cookieHeader)

    // Log all available cookies for debugging
    logger.info('Room namespace: Available cookies', {
      cookieKeys: Object.keys(cookies),
      hasNextAuthToken: !!cookies['next-auth.session-token'],
      hasNextAuthSecureToken: !!cookies['__Secure-next-auth.session-token'],
      hasNextAuthSecureLowerToken: !!cookies['__Secure-nextauth.session-token'],
      sessionTokenLength: cookies['next-auth.session-token']?.length || 0,
      sessionTokenPreview: cookies['next-auth.session-token']?.substring(0, 30) || 'N/A'
    })

    const sessionToken = cookies['next-auth.session-token'] ||
                       cookies['__Secure-next-auth.session-token'] ||
                       cookies['__Secure-nextauth.session-token'] // Try alternative format (lowercase 'auth')

    if (!sessionToken) {
      logger.warn('Room namespace auth failed: No session token found', {
        availableCookies: Object.keys(cookies)
      })
      return next(new Error('Authentication error: No session token found'))
    }

    // Verify session token using NextAuth v5 compatible method
    const decoded = await decodeNextAuthToken(sessionToken)

    if (!decoded) {
      logger.warn('Room namespace auth failed: Token verification failed')
      return next(new Error('Authentication error: Invalid token'))
    }

    logger.info('Room namespace JWT decoded', { userId: decoded.id, email: decoded.email })

    // Connect to database and find user
    await connectDB()
    const user = await User.findById(decoded.id)

    if (!user) {
      logger.warn('Room namespace auth failed: User not found in DB', { userId: decoded.id })
      return next(new Error('Authentication error: User not found'))
    }

    // Attach user to socket data for use in connection handlers
    socket.data.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      photoUrl: user.photoUrl,
      isOnboarded: user.isOnboarded,
      role: user.role,
    }

    logger.info('Room namespace socket authenticated', { socketId: socket.id, userId: user.id })
    next()
  } catch (error: any) {
    // Return generic error to avoid revealing if user exists
    logger.warn('Room namespace authentication error', {
      message: error?.message || 'Unknown error',
      name: error?.name
    })
    next(new Error('Authentication error'))
  }
})

roomNamespace.on('connection', async (socket) => {
  // Extract room ID from namespace name
  const namespace = socket.nsp
  const roomId = namespace.name.replace('/room-', '')

  const user = socket.data.user

  // Safety check - if user is not authenticated, disconnect
  if (!user) {
    logger.warn('Socket connection rejected: No user data (authentication failed)', { socketId: socket.id })
    socket.emit('error', { message: 'Authentication failed' })
    socket.disconnect()
    return
  }

  logger.info('Socket connected', { socketId: socket.id, userId: user.id, email: user.email, roomId })

  // ============================================================================
  // Room Capacity Enforcement & Overflow Room Logic (ROOM-04, ROOM-07)
  // ============================================================================

  await connectDB()

  // Get room details
  const room = await Room.findById(roomId)
  if (!room) {
    socket.emit('error', { message: 'Room not found' })
    socket.disconnect()
    return
  }

  // Get current participant count
  const currentParticipants = getParticipants(roomId)
  const participantCount = currentParticipants.length

  // Check if room is at capacity
  if (participantCount >= room.capacity) {
    // Check if this is an overflow room (limit: 1 overflow per main room, max 16 total)
    if (room.isOverflowRoom) {
      // Overflow room is also full
      socket.emit('room-full', {
        message: 'Room is full',
        roomId: roomId,
        roomName: room.title
      })
      socket.disconnect()
      return
    }

    // Main room is full - check for existing overflow room
    let overflowRoom = await Room.findOne({ parentRoomId: roomId })

    if (!overflowRoom) {
      // Create new overflow room
      logger.info('Creating overflow room for main room', { roomId, participantCount })
      overflowRoom = await Room.create({
        title: `${room.title} - Overflow`,
        scheduledTime: room.scheduledTime,
        duration: room.duration,
        capacity: 4, // Participants 13-16
        status: 'open',
        isOverflowRoom: true,
        parentRoomId: roomId,
        interestTags: room.interestTags
      })

      // Link main room to overflow room
      room.overflowRoomId = overflowRoom._id
      await room.save()

      logger.info('Overflow room created', { mainRoomId: roomId, overflowRoomId: overflowRoom._id.toString() })
    }

    // Redirect user to overflow room
    const overflowRoomId = overflowRoom._id.toString()
    socket.emit('redirect-to-overflow', {
      originalRoomId: roomId,
      originalRoomName: room.title,
      overflowRoomId: overflowRoomId,
      overflowRoomName: overflowRoom.title,
      message: 'This room is full. You\'ve been moved to the overflow room.'
    })

    // Join the overflow room namespace instead
    socket.leave(roomId)
    const overflowNamespace = io.of(`/room-${overflowRoomId}`)
    socket.join(overflowRoomId)

    // Update roomId to overflow room for subsequent handlers
    const actualRoomId = overflowRoomId

    // Handle user join with presence tracking for overflow room
    handleUserJoin(overflowRoomId, socket.id, {
      userId: user.id,
      userName: user.name,
      userPhoto: user.photoUrl,
      socketId: socket.id,
      lastHeartbeat: Date.now()
    }, io)

    // Set up all event handlers for overflow room
    setupRoomEventHandlers(socket, overflowNamespace, overflowRoomId, user, io)
    return
  }

  // Room has capacity - join normally
  socket.join(roomId)

  // Handle user join with presence tracking
  handleUserJoin(roomId, socket.id, {
    userId: user.id,
    userName: user.name,
    userPhoto: user.photoUrl,
    socketId: socket.id,
    lastHeartbeat: Date.now()
  }, io)

  // Set up all event handlers for this room
  setupRoomEventHandlers(socket, roomNamespace, roomId, user, io)
})

// ============================================================================
// Room Event Handlers Setup (shared between main and overflow rooms)
// ============================================================================

  function setupRoomEventHandlers(
    socket: any,
    roomNamespace: any,
    roomId: string,
    user: any,
    io: any
  ) {
  
    // Handle join-room event (explicit join from client)
    socket.on('join-room', (data) => {
      const { roomId: joinRoomId } = data
      handleUserJoin(joinRoomId, socket.id, {
        userId: user.id,
        userName: user.name,
        userPhoto: user.photoUrl,
        socketId: socket.id,
        lastHeartbeat: Date.now()
      }, io)
    })
  
    // Handle leave-room event (explicit leave from client)
    socket.on('leave-room', (data) => {
      const { roomId: leaveRoomId } = data
      handleUserLeave(leaveRoomId, socket.id, io)
    })
  
    // Handle heartbeat event (keep-alive from client)
    socket.on('heartbeat', (data) => {
      const { roomId: heartbeatRoomId } = data
      updateHeartbeat(heartbeatRoomId, socket.id)
    })
  
    // Handle WebRTC signaling events
    socket.on('signal', (data) => {
      // Forward signal to target user in the room
      // data should contain: { targetUserId, signal }
      if (data.targetUserId) {
        socket.to(roomId).emit('signal', {
          fromUserId: user.id,
          signal: data.signal,
        })
      }
    })
  
    // Handle chat messages with validation and rate limiting
    socket.on('chat-message', async (data) => {
      try {
        // Validate message with Zod
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
  
        // Save to MongoDB FIRST
        const chatMessage = await ChatMessage.create({
          roomId: roomId,
          userId: user.id,
          userName: user.name,
          userPhoto: user.photoUrl,
          message: message
        })
  
        // Broadcast to room after successful save
        const messageData = {
          messageId: chatMessage._id.toString(),
          userId: user.id,
          userName: user.name,
          userPhoto: user.photoUrl,
          message: message,
          timestamp: chatMessage.timestamp.toISOString()
        }

        roomNamespace.to(roomId).emit('chat-message', messageData)

        // Chat sharing per D-12: Forward messages between main and overflow rooms
        // Get room details to check if this is a main or overflow room
        await connectDB()
        const room = await Room.findById(roomId)

        if (room) {
          if (room.isOverflowRoom && room.parentRoomId) {
            // Forward to main room
            const mainRoomId = room.parentRoomId.toString()
            io.of(`/room-${mainRoomId}`).to(mainRoomId).emit('chat-message', messageData)
          } else if (room.overflowRoomId) {
            // Forward to overflow room
            const overflowRoomId = room.overflowRoomId.toString()
            io.of(`/room-${overflowRoomId}`).to(overflowRoomId).emit('chat-message', messageData)
          }
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          socket.emit('chat-error', { error: 'Invalid message format. Message must be 1-500 characters.' })
        } else {
          logger.error('Error saving chat message', error, { userId: user.id, roomId })
          socket.emit('chat-error', { error: 'Failed to send message. Please try again.' })
        }
      }
    })
  
    // Handle chat history fetch
    socket.on('fetch-history', async (data) => {
      try {
        const { limit = 50 } = data || {}
  
        const recentMessages = await ChatMessage.find({
          roomId: roomId
        })
          .sort({ timestamp: -1 })
          .limit(limit)
          .lean()
  
        // Send in chronological order
        socket.emit('chat-history', {
          messages: recentMessages.reverse().map(msg => ({
            messageId: msg._id.toString(),
            userId: (msg.userId as any).toString(),
            userName: msg.userName,
            userPhoto: msg.userPhoto,
            message: msg.message,
            timestamp: msg.timestamp.toISOString()
          }))
        })
      } catch (error) {
        logger.error('Error fetching chat history', error, { userId: user.id, roomId })
        socket.emit('chat-error', { error: 'Failed to load message history' })
      }
    })
  
    // Handle fetch-presence event (for reconnection state sync)
    socket.on('fetch-presence', (data: { roomId: string }) => {
      const { roomId: presenceRoomId } = data
      const participants = getParticipants(presenceRoomId)
      socket.emit('presence-sync', { participants })
    })
  
    // ============================================================================
    // WebRTC Signaling Event Handlers
    // ============================================================================
  
    // Handle get-router-rtp-capabilities (client requests router capabilities)
    socket.on('get-router-rtp-capabilities', async () => {
      try {
        // Create router for room if not exists
        const { router, rtpCapabilities } = await createRoomRouter(roomId)
        socket.emit('router-rtp-capabilities', { rtpCapabilities })
        logger.debug('Sent RTP capabilities to socket in room', { socketId: socket.id, roomId })
      } catch (error) {
        logger.error('Error getting router RTP capabilities for room', error, { socketId: socket.id, roomId })
        socket.emit('error', { message: 'Failed to get router capabilities' })
      }
    })
  
    // Handle create-transport (client requests WebRTC transport)
    socket.on('create-transport', async (data: { forceTcp?: boolean }) => {
      try {
        const { forceTcp = false } = data

        // Create WebRTC transport
        const transportInfo = await createWebRtcTransport(roomId, {
          socketId: socket.id,
          roomId,
          forceTcp,
        })

        socket.emit('transport-created', transportInfo)
        logger.debug('Created WebRTC transport for socket in room', { socketId: socket.id, roomId, transportId: transportInfo.id })
      } catch (error) {
        logger.error('Error creating transport for socket in room', error, { socketId: socket.id, roomId })
        socket.emit('error', { message: 'Failed to create transport' })
      }
    })
  
    // Handle connect-transport (client sends DTLS parameters)
    socket.on('connect-transport', async (data: { transportId: string; dtlsParameters: any }) => {
      try {
        const { transportId, dtlsParameters } = data

        // Transport is already connected on server side, just confirm
        socket.emit('transport-connected', { transportId })
        logger.debug('Transport connected by socket in room', { socketId: socket.id, roomId, transportId })
      } catch (error) {
        logger.error('Error connecting transport for socket in room', error, { socketId: socket.id, transportId })
        socket.emit('error', { message: 'Failed to connect transport' })
      }
    })
  
    // Handle produce (client creates producer for audio/video)
    socket.on('produce', async (data: { transportId: string; kind: 'audio' | 'video'; rtpParameters: any }) => {
      try {
        const { transportId, kind, rtpParameters } = data

        // Create producer
        const producerId = await createProducer(roomId, {
          transportId,
          kind,
          rtpParameters,
        })

        socket.emit('producer-created', { id: producerId })

        // Notify other participants about new producer
        socket.to(roomId).emit('new-producer', {
          producerId,
          userId: user.id,
          kind,
        })

        logger.debug('Created producer for socket in room', { socketId: socket.id, roomId, kind, producerId })
      } catch (error) {
        logger.error('Error creating producer for socket in room', error, { socketId: socket.id, roomId, kind: data.kind })
        socket.emit('error', { message: 'Failed to create producer' })
      }
    })
  
    // Handle consume (client creates consumer for incoming stream)
    socket.on('consume', async (data: { producerId: string; rtpCapabilities: any }) => {
      try {
        const { producerId, rtpCapabilities } = data

        // Create consumer
        const consumerInfo = await createConsumer(roomId, socket.id, {
          producerId,
          rtpCapabilities,
        })

        socket.emit('consumer-created', consumerInfo)
        logger.debug('Created consumer for socket in room', { socketId: socket.id, roomId, kind: consumerInfo.kind, consumerId: consumerInfo.id })
      } catch (error) {
        logger.error('Error creating consumer for socket in room', error, { socketId: socket.id, roomId })
        socket.emit('error', { message: 'Failed to create consumer' })
      }
    })
  
    // Handle resume-consumer (client resumes paused consumer)
    socket.on('resume-consumer', async (data: { consumerId: string }) => {
      try {
        const { consumerId } = data
        // Consumer resume logic would go here (currently not implemented in webrtc-server.ts)
        socket.emit('consumer-resumed', { consumerId })
        logger.debug('Resumed consumer for socket', { socketId: socket.id, consumerId })
      } catch (error) {
        logger.error('Error resuming consumer for socket', error, { socketId: socket.id, consumerId })
        socket.emit('error', { message: 'Failed to resume consumer' })
      }
    })
  
    // Handle get-turn-credentials (client requests TURN credentials)
    socket.on('get-turn-credentials', async () => {
      try {
        // Generate TURN credentials for this user
        const turnCredentials = generateTurnCredentials(user.id)

        // Get ICE server configuration
        const iceServers = getIceServers(turnCredentials)

        socket.emit('turn-credentials', {
          username: turnCredentials.username,
          password: turnCredentials.password,
          ttl: turnCredentials.ttl,
          iceServers,
        })

        logger.debug('Generated TURN credentials for user', { userId: user.id })
      } catch (error) {
        logger.error('Error generating TURN credentials for user', error, { userId: user.id })
        socket.emit('error', { message: 'Failed to generate TURN credentials' })
      }
    })
  
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { socketId: socket.id, userId: user.id, email: user.email, roomId })
      socket.leave(roomId)

      // Handle user leave with presence tracking (handles multiple tabs correctly)
      handleUserLeave(roomId, socket.id, io)

      // Close WebRTC transport for this socket
      closeTransport(roomId, socket.id).catch((error) => {
        logger.error('Error closing transport for socket', error, { socketId: socket.id })
      })
    })
  
    // Handle audio toggle
    socket.on('toggle-audio', (data) => {
      socket.to(roomId).emit('user-audio-toggled', {
        userId: user.id,
        isMuted: data.isMuted,
      })
    })
  
    // Handle video toggle
    socket.on('toggle-video', (data) => {
      socket.to(roomId).emit('user-video-toggled', {
        userId: user.id,
        isVideoOff: data.isVideoOff,
      })
    })

    // ============================================================================
    // Captain Event Handlers (CAPT-02, CAPT-03)
    // ============================================================================

    // Notify user when invited to become captain
    socket.on('captain-invited', async (data) => {
      try {
        const { invitationId } = data
        // Fetch invitation details
        const invitation = await CaptainAssignment.findById(invitationId).populate('roomId')

        if (invitation && invitation.userId.toString() === user.id) {
          socket.emit('captain-invitation', {
            invitationId: invitation._id.toString(),
            roomTitle: invitation.roomId?.title || 'Focus Room',
            message: "You've been invited to become a room captain!",
          })
        }
      } catch (error) {
        logger.error('Error handling captain-invited', error, { userId: user.id, invitationId })
      }
    })

    // Notify user when assigned as captain to a room
    socket.on('captain-assigned', async (data) => {
      try {
        const { roomId: assignedRoomId } = data
        // Fetch room details
        const room = await Room.findById(assignedRoomId)

        if (room) {
          socket.emit('captain-assignment', {
            roomId: room._id.toString(),
            roomTitle: room.title,
            scheduledTime: room.scheduledTime,
            message: "You're assigned as captain for this room",
          })

          // Also emit to room participants that captain has joined
          roomNamespace.to(roomId).emit('captain-joined', {
            captainId: user.id,
            captainName: user.name,
          })
        }
      } catch (error) {
        logger.error('Error handling captain-assigned', error, { userId: user.id, assignedRoomId })
      }
    })

    // Handle captain mute-all event
    socket.on('captain-mute-all', async () => {
      try {
        // Verify user is captain for this room
        const room = await Room.findById(roomId)
        if (room && room.captainId?.toString() === user.id) {
          // Emit muted event to all participants except captain
          socket.to(roomId).emit('muted-by-captain', {
            captainId: user.id,
            captainName: user.name,
          })
        }
      } catch (error) {
        logger.error('Error handling captain-mute-all', error, { userId: user.id, roomId })
      }
    })

    // Handle captain unmute-all event
    socket.on('captain-unmute-all', async () => {
      try {
        // Verify user is captain for this room
        const room = await Room.findById(roomId)
        if (room && room.captainId?.toString() === user.id) {
          // Emit unmuted event to all participants
          roomNamespace.to(roomId).emit('unmuted-by-captain', {
            captainId: user.id,
            captainName: user.name,
          })
        }
      } catch (error) {
        logger.error('Error handling captain-unmute-all', error, { userId: user.id, roomId })
      }
    })

    // Handle captain mute participant event
    socket.on('captain-mute-participant', async (data) => {
      try {
        const { targetUserId } = data
        // Verify user is captain for this room
        const room = await Room.findById(roomId)
        if (room && room.captainId?.toString() === user.id) {
          // Find target user's socket and emit muted event
          roomNamespace.to(roomId).emit('participant-muted', {
            targetUserId,
            captainId: user.id,
            captainName: user.name,
          })
        }
      } catch (error) {
        logger.error('Error handling captain-mute-participant', error, { userId: user.id, roomId, targetUserId })
      }
    })

    // Handle captain unmute participant event
    socket.on('captain-unmute-participant', async (data) => {
      try {
        const { targetUserId } = data
        // Verify user is captain for this room
        const room = await Room.findById(roomId)
        if (room && room.captainId?.toString() === user.id) {
          // Emit unmuted event to target user
          roomNamespace.to(roomId).emit('participant-unmuted', {
            targetUserId,
            captainId: user.id,
            captainName: user.name,
          })
        }
      } catch (error) {
        logger.error('Error handling captain-unmute-participant', error, { userId: user.id, roomId, targetUserId })
      }
    })
  }
  
  // Start the server
  httpServer.listen(PORT, () => {
    logger.info('Socket.IO server started', { port: PORT, corsOrigin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000' })
  })

  // Start heartbeat cleanup interval
  startHeartbeatCleanup(io)
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down Socket.IO server gracefully')
    httpServer.close(() => {
      logger.info('Socket.IO server closed')
      process.exit(0)
    })
  })
  
  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down Socket.IO server gracefully')
    httpServer.close(() => {
      logger.info('Socket.IO server closed')
      process.exit(0)
    })
})
