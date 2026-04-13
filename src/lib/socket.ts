import { io, Socket as IOSocket } from 'socket.io-client'

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Re-export Socket type for use in other modules
 */
export type Socket = IOIOSocket<ServerToClientEvents, ClientToServerEvents>

/**
 * Server-to-client event types
 */
export interface ServerToClientEvents {
  // WebRTC signaling
  signal: (data: {
    fromUserId: string
    signal: RTCSessionDescriptionInit | RTCIceCandidate
  }) => void

  // WebRTC mediasoup signaling
  'router-rtp-capabilities': (data: { rtpCapabilities: any }) => void
  'transport-created': (data: {
    id: string
    iceParameters: any
    iceCandidates: any[]
    dtlsParameters: any
  }) => void
  'transport-connected': (data: { transportId: string }) => void
  'producer-created': (data: { id: string }) => void
  'new-producer': (data: {
    producerId: string
    userId: string
    kind: 'audio' | 'video'
  }) => void
  'consumer-created': (data: {
    id: string
    producerId: string
    kind: 'audio' | 'video'
    rtpParameters: any
  }) => void
  'consumer-resumed': (data: { consumerId: string }) => void
  'turn-credentials': (data: {
    username: string
    password: string
    ttl: number
    iceServers: RTCConfiguration['iceServers']
  }) => void

  // Room presence
  'user-joined': (data: {
    userId: string
    userName: string
    timestamp: string
  }) => void

  'user-left': (data: {
    userId: string
    userName: string
    timestamp: string
  }) => void

  // Chat
  'chat-message': (data: {
    userId: string
    userName: string
    message: string
    timestamp: string
  }) => void

  // Media state changes
  'user-audio-toggled': (data: {
    userId: string
    isMuted: boolean
  }) => void

  'user-video-toggled': (data: {
    userId: string
    isVideoOff: boolean
  }) => void

  // Error responses
  error: (data: { message: string }) => void
}

/**
 * Client-to-server event types
 */
export interface ClientToServerEvents {
  // WebRTC signaling
  signal: (data: {
    targetUserId: string
    signal: RTCSessionDescriptionInit | RTCIceCandidate
  }) => void

  // WebRTC mediasoup signaling
  'get-router-rtp-capabilities': () => void
  'create-transport': (data: { forceTcp?: boolean }) => void
  'connect-transport': (data: {
    transportId: string
    dtlsParameters: any
  }) => void
  'produce': (data: {
    transportId: string
    kind: 'audio' | 'video'
    rtpParameters: any
  }) => void
  'consume': (data: {
    producerId: string
    rtpCapabilities: any
  }) => void
  'resume-consumer': (data: { consumerId: string }) => void
  'get-turn-credentials': () => void

  // Chat
  'chat-message': (data: {
    message: string
  }) => void

  // Media state changes
  'toggle-audio': (data: {
    isMuted: boolean
  }) => void

  'toggle-video': (data: {
    isVideoOff: boolean
  }) => void
}

/**
 * Room namespace type
 */
export type SocketRoom = `room-${string}`

/**
 * Socket event names (for type safety)
 */
export const SocketEvent = {
  // Server-to-client
  SIGNAL: 'signal',
  ROUTER_RTP_CAPABILITIES: 'router-rtp-capabilities',
  TRANSPORT_CREATED: 'transport-created',
  TRANSPORT_CONNECTED: 'transport-connected',
  PRODUCER_CREATED: 'producer-created',
  NEW_PRODUCER: 'new-producer',
  CONSUMER_CREATED: 'consumer-created',
  CONSUMER_RESUMED: 'consumer-resumed',
  TURN_CREDENTIALS: 'turn-credentials',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  CHAT_MESSAGE: 'chat-message',
  USER_AUDIO_TOGGLED: 'user-audio-toggled',
  USER_VIDEO_TOGGLED: 'user-video-toggled',
  ERROR: 'error',

  // Client-to-server
  SEND_SIGNAL: 'signal',
  GET_ROUTER_RTP_CAPABILITIES: 'get-router-rtp-capabilities',
  CREATE_TRANSPORT: 'create-transport',
  CONNECT_TRANSPORT: 'connect-transport',
  PRODUCE: 'produce',
  CONSUME: 'consume',
  RESUME_CONSUMER: 'resume-consumer',
  GET_TURN_CREDENTIALS: 'get-turn-credentials',
  SEND_CHAT_MESSAGE: 'chat-message',
  TOGGLE_AUDIO: 'toggle-audio',
  TOGGLE_VIDEO: 'toggle-video',
} as const

// ============================================================================
// Socket Connection Management
// ============================================================================

/**
 * Singleton pattern to prevent duplicate connections to the same room
 */
class SocketManager {
  private connections: Map<string, IOSocket<ServerToClientEvents, ClientToServerEvents>> = new Map()

  /**
   * Connect to a room namespace
   * @param roomId - The room ID to connect to
   * @returns Socket instance for the room
   */
  connectToRoom(
    roomId: string
  ): IOSocket<ServerToClientEvents, ClientToServerEvents> {
    const roomNamespace: SocketRoom = `room-${roomId}`

    // Return existing connection if available
    if (this.connections.has(roomNamespace)) {
      const socket = this.connections.get(roomNamespace)!
      if (socket.connected) {
        console.log(`Reusing existing socket connection for ${roomNamespace}`)
        return socket
      } else {
        // Remove disconnected socket
        this.connections.delete(roomNamespace)
      }
    }

    // Get socket server URL from environment
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001'

    // Create new socket connection
    const socket: IOSocket<ServerToClientEvents, ClientToServerEvents> = io(
      `${socketUrl}/${roomNamespace}`,
      {
        withCredentials: true, // Send cookies for authentication
        transports: ['websocket', 'polling'], // WebSocket with polling fallback
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      }
    )

    // Store connection
    this.connections.set(roomNamespace, socket)

    // Log connection lifecycle
    socket.on('connect', () => {
      console.log(`Connected to room namespace: ${roomNamespace}`)
    })

    socket.on('disconnect', (reason) => {
      console.log(`Disconnected from ${roomNamespace}: ${reason}`)
    })

    socket.on('connect_error', (error) => {
      console.error(`Connection error to ${roomNamespace}:`, error.message)
    })

    socket.io.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to ${roomNamespace} after ${attemptNumber} attempts`)
      // Request full state sync from server after reconnection
      ;(socket as any).emit('request-state-sync', { roomId })
    })

    socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnecting to ${roomNamespace}... attempt ${attemptNumber}`)
    })

    socket.io.on('reconnect_error', (error) => {
      console.error(`Reconnection error to ${roomNamespace}:`, error.message)
    })

    socket.io.on('reconnect_failed', () => {
      console.error(`Failed to reconnect to ${roomNamespace} after max attempts`)
    })

    return socket
  }

  /**
   * Disconnect from a room namespace
   * @param roomId - The room ID to disconnect from
   */
  disconnectFromRoom(roomId: string): void {
    const roomNamespace: SocketRoom = `room-${roomId}`
    const socket = this.connections.get(roomNamespace)

    if (socket) {
      socket.disconnect()
      this.connections.delete(roomNamespace)
      console.log(`Disconnected from room namespace: ${roomNamespace}`)
    }
  }

  /**
   * Disconnect from all rooms
   */
  disconnectAll(): void {
    this.connections.forEach((socket, roomNamespace) => {
      socket.disconnect()
      console.log(`Disconnected from room namespace: ${roomNamespace}`)
    })
    this.connections.clear()
  }

  /**
   * Get active connection count
   */
  getActiveConnectionCount(): number {
    return this.connections.size
  }

  /**
   * Check if connected to a specific room
   * @param roomId - The room ID to check
   * @returns true if connected, false otherwise
   */
  isConnectedTo(roomId: string): boolean {
    const roomNamespace: SocketRoom = `room-${roomId}`
    const socket = this.connections.get(roomNamespace)
    return socket?.connected ?? false
  }
}

// Export singleton instance
const socketManager = new SocketManager()

// Export convenience function
export function connectToRoom(
  roomId: string
): IOSocket<ServerToClientEvents, ClientToServerEvents> {
  return socketManager.connectToRoom(roomId)
}

export function disconnectFromRoom(roomId: string): void {
  socketManager.disconnectFromRoom(roomId)
}

export function disconnectAllRooms(): void {
  socketManager.disconnectAll()
}

export function isConnectedTo(roomId: string): boolean {
  return socketManager.isConnectedTo(roomId)
}

export function getActiveConnectionCount(): number {
  return socketManager.getActiveConnectionCount()
}

// Export socket manager for advanced usage
export { socketManager }
export { socketManager as socket }
export default socketManager
