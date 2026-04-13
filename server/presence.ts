import { Server } from 'socket.io'

// ============================================================================
// Type Definitions
// ============================================================================

interface PresenceData {
  userId: string
  userName: string
  userPhoto?: string
  socketId: string
  lastHeartbeat: number
}

// ============================================================================
// Presence Tracking Data Structures
// ============================================================================

// Room ID -> Set of user IDs (for accurate participant count)
// This tracks unique users, not sockets (handles multiple tabs per user)
const roomPresence = new Map<string, Set<string>>()

// Room ID -> Map of socket ID -> PresenceData (for socket-level tracking)
// This tracks individual socket connections with metadata
const socketData = new Map<string, Map<string, PresenceData>>()

// Heartbeat configuration
const HEARTBEAT_INTERVAL_MS = 30000 // 30 seconds
const CLEANUP_THRESHOLD_MS = 2 * HEARTBEAT_INTERVAL_MS // 60 seconds

// ============================================================================
// Presence Management Functions
// ============================================================================

/**
 * Handle a user joining a room
 * @param roomId - The room ID
 * @param socketId - The socket ID
 * @param userData - User presence data
 * @param io - Socket.IO server instance (for broadcasting)
 */
export function handleUserJoin(
  roomId: string,
  socketId: string,
  userData: PresenceData,
  io: Server
): void {
  // Add user to room presence (tracks unique users)
  if (!roomPresence.has(roomId)) {
    roomPresence.set(roomId, new Set())
  }
  roomPresence.get(roomId)!.add(userData.userId)

  // Track socket-level data (tracks individual connections)
  if (!socketData.has(roomId)) {
    socketData.set(roomId, new Map())
  }
  socketData.get(roomId)!.set(socketId, userData)

  // Get the room namespace
  const roomNamespace = io.of(`/room-${roomId}`)

  // Broadcast user-joined event to all participants
  roomNamespace.emit('user-joined', {
    userId: userData.userId,
    userName: userData.userName,
    userPhoto: userData.userPhoto,
    timestamp: new Date().toISOString(),
  })

  // Broadcast updated participant count
  broadcastPresence(roomId, io)

  console.log(`User ${userData.userId} joined room ${roomId} (socket: ${socketId})`)
}

/**
 * Handle a user leaving a room
 * @param roomId - The room ID
 * @param socketId - The socket ID
 * @param io - Socket.IO server instance (for broadcasting)
 */
export function handleUserLeave(
  roomId: string,
  socketId: string,
  io: Server
): void {
  const sockets = socketData.get(roomId)
  if (!sockets) {
    console.warn(`No sockets found for room ${roomId}`)
    return
  }

  const data = sockets.get(socketId)
  if (!data) {
    console.warn(`Socket ${socketId} not found in room ${roomId}`)
    return
  }

  // Remove socket from tracking
  sockets.delete(socketId)

  // Check if user has other sockets in this room (handles multiple tabs)
  const hasOtherSockets = Array.from(sockets.values()).some(
    (s) => s.userId === data.userId
  )

  if (!hasOtherSockets) {
    // User completely left the room (no more sockets)
    roomPresence.get(roomId)?.delete(data.userId)

    // Get the room namespace
    const roomNamespace = io.of(`/room-${roomId}`)

    // Broadcast user-left event
    roomNamespace.emit('user-left', {
      userId: data.userId,
      userName: data.userName,
      timestamp: new Date().toISOString(),
    })

    console.log(`User ${data.userId} left room ${roomId}`)
  } else {
    console.log(
      `Socket ${socketId} disconnected, but user ${data.userId} still in room ${roomId} (${sockets.size} sockets remaining)`
    )
  }

  // Clean up empty rooms
  if (sockets.size === 0) {
    socketData.delete(roomId)
    roomPresence.delete(roomId)
    console.log(`Cleaned up empty room: ${roomId}`)
  }

  // Broadcast updated participant count
  broadcastPresence(roomId, io)
}

/**
 * Broadcast presence update to all room participants
 * @param roomId - The room ID
 * @param io - Socket.IO server instance
 */
export async function broadcastPresence(roomId: string, io: Server): Promise<void> {
  const participantIds = roomPresence.get(roomId)
  const count = participantIds?.size || 0

  // Get the room namespace
  const roomNamespace = io.of(`/room-${roomId}`)

  // Build participants array with metadata
  const participants: Array<{
    userId: string
    userName: string
    userPhoto?: string
  }> = []

  const sockets = socketData.get(roomId)
  if (sockets && participantIds) {
    // Use a Map to deduplicate users (in case of multiple sockets)
    const userMap = new Map<string, PresenceData>()

    for (const [socketId, data] of sockets.entries()) {
      if (!userMap.has(data.userId)) {
        userMap.set(data.userId, data)
      }
    }

    participants.push(
      ...Array.from(userMap.values()).map((data) => ({
        userId: data.userId,
        userName: data.userName,
        userPhoto: data.userPhoto,
      }))
    )
  }

  // Broadcast presence update to current room
  roomNamespace.emit('presence-update', {
    participantCount: count,
    participants: participants,
  })

  // Presence sharing per D-12: Broadcast to overflow room if exists
  try {
    const { Room } = await import('../src/models/Room.ts')
    const { connectDB } = await import('../src/lib/db.ts')

    await connectDB()

    const room = await Room.findById(roomId)

    if (room) {
      let overflowRoomId: string | null = null

      if (room.isOverflowRoom && room.parentRoomId) {
        // This is an overflow room - broadcast to main room
        const mainRoomId = room.parentRoomId.toString()
        const mainRoomNamespace = io.of(`/room-${mainRoomId}`)

        // Get main room participant count
        const mainRoomCount = roomPresence.get(mainRoomId)?.size || 0

        mainRoomNamespace.emit('presence-update', {
          participantCount: mainRoomCount,
          participants: participants, // Send overflow room participants to main room
          overflowRoom: true // Flag to indicate this is from overflow room
        })
      } else if (room.overflowRoomId) {
        // This is a main room - broadcast to overflow room
        overflowRoomId = room.overflowRoomId.toString()
        const overflowRoomNamespace = io.of(`/room-${overflowRoomId}`)

        // Get overflow room participant count
        const overflowRoomCount = roomPresence.get(overflowRoomId)?.size || 0

        overflowRoomNamespace.emit('presence-update', {
          participantCount: overflowRoomCount,
          participants: participants, // Send main room participants to overflow room
          mainRoom: true // Flag to indicate this is from main room
        })
      }
    }
  } catch (error) {
    console.error('Error broadcasting presence to overflow room:', error)
  }
}

/**
 * Update heartbeat timestamp for a socket
 * @param roomId - The room ID
 * @param socketId - The socket ID
 */
export function updateHeartbeat(roomId: string, socketId: string): void {
  const sockets = socketData.get(roomId)
  if (sockets?.has(socketId)) {
    const socketInfo = sockets.get(socketId)!
    socketInfo.lastHeartbeat = Date.now()
    sockets.set(socketId, socketInfo)
  }
}

// ============================================================================
// Heartbeat Cleanup Interval
// ============================================================================

/**
 * Start the heartbeat cleanup interval
 * @param io - Socket.IO server instance
 * @returns Interval ID (for testing/cleanup)
 */
export function startHeartbeatCleanup(io: Server): NodeJS.Timeout {
  const interval = setInterval(() => {
    const now = Date.now()
    let cleanedSockets = 0
    let cleanedRooms = 0

    // Iterate through all rooms
    for (const [roomId, sockets] of socketData.entries()) {
      // Find stale sockets
      const staleSocketIds: string[] = []

      for (const [socketId, data] of sockets.entries()) {
        if (now - data.lastHeartbeat > CLEANUP_THRESHOLD_MS) {
          staleSocketIds.push(socketId)
        }
      }

      // Remove stale sockets
      for (const socketId of staleSocketIds) {
        console.log(
          `Cleaning up stale socket ${socketId} in room ${roomId} (last heartbeat: ${Math.round(
            (now - sockets.get(socketId)!.lastHeartbeat) / 1000
          )}s ago)`
        )
        handleUserLeave(roomId, socketId, io)
        cleanedSockets++
      }

      // Track empty rooms cleaned
      if (!socketData.has(roomId)) {
        cleanedRooms++
      }
    }

    // Log cleanup summary
    if (cleanedSockets > 0 || cleanedRooms > 0) {
      console.log(
        `Heartbeat cleanup: ${cleanedSockets} stale sockets, ${cleanedRooms} empty rooms removed`
      )
    }
  }, HEARTBEAT_INTERVAL_MS)

  console.log(`Heartbeat cleanup interval started (${HEARTBEAT_INTERVAL_MS}ms)`)

  return interval
}

// ============================================================================
// Utility Functions (for testing and monitoring)
// ============================================================================

/**
 * Get current presence state for a room
 * @param roomId - The room ID
 * @returns Object with participant count and participant details
 */
export function getRoomPresence(roomId: string): {
  participantCount: number
  participants: Array<{
    userId: string
    userName: string
    userPhoto?: string
    socketCount: number
  }> | null
} {
  const participantIds = roomPresence.get(roomId)
  const sockets = socketData.get(roomId)

  if (!participantIds || !sockets) {
    return { participantCount: 0, participants: null }
  }

  // Build participants list with socket count
  const userMap = new Map<string, { userName: string; userPhoto?: string; socketCount: number }>()

  for (const [socketId, data] of sockets.entries()) {
    const existing = userMap.get(data.userId)
    if (existing) {
      existing.socketCount++
    } else {
      userMap.set(data.userId, {
        userName: data.userName,
        userPhoto: data.userPhoto,
        socketCount: 1,
      })
    }
  }

  return {
    participantCount: participantIds.size,
    participants: Array.from(userMap.entries()).map(([userId, data]) => ({
      userId,
      userName: data.userName,
      userPhoto: data.userPhoto,
      socketCount: data.socketCount,
    })),
  }
}

/**
 * Get global presence statistics
 * @returns Object with total rooms and total participants
 */
export function getPresenceStats(): {
  totalRooms: number
  totalParticipants: number
  totalSockets: number
} {
  let totalParticipants = 0
  let totalSockets = 0

  for (const [roomId, participants] of roomPresence.entries()) {
    totalParticipants += participants.size
  }

  for (const [roomId, sockets] of socketData.entries()) {
    totalSockets += sockets.size
  }

  return {
    totalRooms: roomPresence.size,
    totalParticipants,
    totalSockets,
  }
}

/**
 * Get participants for a room as an array
 * @param roomId - The room ID
 */
export function getParticipants(roomId: string): Array<{ userId: string; userName: string; userPhoto?: string }> {
  const participantIds = roomPresence.get(roomId)
  const sockets = socketData.get(roomId)

  if (!participantIds || !sockets) return []

  const userMap = new Map<string, { userName: string; userPhoto?: string }>()

  for (const [, data] of sockets.entries()) {
    if (!userMap.has(data.userId)) {
      userMap.set(data.userId, { userName: data.userName, userPhoto: data.userPhoto })
    }
  }

  return Array.from(userMap.entries()).map(([userId, data]) => ({
    userId,
    userName: data.userName,
    userPhoto: data.userPhoto,
  }))
}

/**
 * Get participants across main and overflow rooms
 * @param roomId - The main room ID or overflow room ID
 * @returns Combined participant list from both rooms
 */
export async function getParticipantsWithOverflow(roomId: string): Promise<{
  mainRoomParticipants: Array<{ userId: string; userName: string; userPhoto?: string }>
  overflowRoomParticipants: Array<{ userId: string; userName: string; userPhoto?: string }>
  totalParticipants: number
}> {
  // Import Room model here to avoid circular dependency
  const { Room } = await import('../src/models/Room.ts')
  const { connectDB } = await import('../src/lib/db.ts')

  await connectDB()

  // Get room details
  const room = await Room.findById(roomId)

  if (!room) {
    return {
      mainRoomParticipants: [],
      overflowRoomParticipants: [],
      totalParticipants: 0
    }
  }

  let mainRoomId: string
  let overflowRoomId: string | null = null

  if (room.isOverflowRoom) {
    // This is an overflow room - get parent room
    mainRoomId = room.parentRoomId?.toString() || roomId
    overflowRoomId = roomId
  } else {
    // This is a main room
    mainRoomId = roomId
    overflowRoomId = room.overflowRoomId?.toString() || null
  }

  // Get participants from main room
  const mainRoomParticipants = getParticipants(mainRoomId)

  // Get participants from overflow room (if exists)
  let overflowRoomParticipants: Array<{ userId: string; userName: string; userPhoto?: string }> = []
  if (overflowRoomId) {
    overflowRoomParticipants = getParticipants(overflowRoomId)
  }

  return {
    mainRoomParticipants,
    overflowRoomParticipants,
    totalParticipants: mainRoomParticipants.length + overflowRoomParticipants.length
  }
}

/**
 * Clear all presence data (for testing)
 */
export function clearPresence(): void {
  roomPresence.clear()
  socketData.clear()
}

// Export data structures for testing
export { roomPresence, socketData, HEARTBEAT_INTERVAL_MS, CLEANUP_THRESHOLD_MS }
