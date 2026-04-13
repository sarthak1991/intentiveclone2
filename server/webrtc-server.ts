import {
  createWorker,
  types,
} from 'mediasoup'
import crypto from 'crypto'
import { createLogger } from './logger'

type Worker = types.Worker
type Router = types.Router
type WebRtcTransport = types.WebRtcTransport
type Producer = types.Producer
type Consumer = types.Consumer
type RtpCapabilities = types.RtpCapabilities
type RtpCodecCapability = types.RtpCodecCapability

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * MediaSoup room state
 */
interface MediaSoupRoom {
  router: Router
  transports: Map<string, WebRtcTransport> // socketId -> transport
  producers: Map<string, Producer>         // socketId -> producer
  consumers: Map<string, Consumer[]>       // userId -> consumers
}

/**
 * Transport creation options
 */
interface TransportOptions {
  socketId: string
  roomId: string
  forceTcp?: boolean
}

/**
 * Producer creation options
 */
interface ProducerOptions {
  transportId: string
  kind: 'audio' | 'video'
  rtpParameters: any
  paused?: boolean
}

/**
 * Consumer creation options
 */
interface ConsumerOptions {
  producerId: string
  rtpCapabilities: RtpCapabilities
}

/**
 * TURN credentials response
 */
interface TurnCredentials {
  username: string
  password: string
  ttl: number
}

// ============================================================================
// Global State
// ============================================================================

let worker: Worker | null = null
const rooms = new Map<string, MediaSoupRoom>()

// Create logger for this module
const logger = createLogger('webrtc-server')

// ============================================================================
// Worker Management
// ============================================================================

/**
 * Create and configure mediasoup worker (singleton)
 * Called once on server startup
 */
export async function startMediasoup(): Promise<Worker> {
  if (worker) {
    logger.debug('Mediasoup worker already running')
    return worker
  }

  const logLevel = (process.env.MEDIASOUP_LOG_LEVEL || 'warn') as 'debug' | 'warn' | 'error' | 'none'
  const rtcMinPort = parseInt(process.env.MEDIASOUP_RTC_MIN_PORT || '40000', 10)
  const rtcMaxPort = parseInt(process.env.MEDIASOUP_RTC_MAX_PORT || '49999', 10)

  try {
    worker = await createWorker({
      logLevel,
      logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
      rtcMinPort,
      rtcMaxPort,
    })

    logger.info('Mediasoup worker created', { logLevel, rtcMinPort, rtcMaxPort })

    // Handle worker death (critical error)
    worker.on('died', () => {
      logger.error('Mediasoup worker died unexpectedly, exiting process')
      process.exit(1)
    })

    return worker
  } catch (error) {
    logger.error('Failed to create mediasoup worker', error)
    throw error
  }
}

/**
 * Get the mediasoup worker instance
 * @throws Error if worker not initialized
 */
export function getWorker(): Worker {
  if (!worker) {
    throw new Error('Mediasoup worker not initialized. Call startMediasoup() first.')
  }
  return worker
}

// ============================================================================
// Router Management
// ============================================================================

/**
 * Supported RTP codecs for audio and video
 * Note: preferredPayloadType is optional and will be auto-assigned by mediasoup
 */
const SUPPORTED_CODECS: RtpCodecCapability[] = [
  // Audio codecs
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  } as RtpCodecCapability,
  {
    kind: 'audio',
    mimeType: 'audio/PCMU',
    clockRate: 8000,
    channels: 1,
  } as RtpCodecCapability,
  {
    kind: 'audio',
    mimeType: 'audio/PCMA',
    clockRate: 8000,
    channels: 1,
  } as RtpCodecCapability,
  // Video codecs
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
  } as RtpCodecCapability,
  {
    kind: 'video',
    mimeType: 'video/VP9',
    clockRate: 90000,
  } as RtpCodecCapability,
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
    },
  } as unknown as RtpCodecCapability,
]

/**
 * Create a router for a room (or get existing router)
 * @param roomId - The room ID
 * @returns Router instance with RTP capabilities
 */
export async function createRoomRouter(roomId: string): Promise<{
  router: Router
  rtpCapabilities: RtpCapabilities
}> {
  // Check if router already exists for this room
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId)!
    logger.debug('Router already exists for room', { roomId })
    return {
      router: room.router,
      rtpCapabilities: room.router.rtpCapabilities,
    }
  }

  try {
    const workerInstance = getWorker()

    // Create router with media codecs
    const router = await workerInstance.createRouter({
      mediaCodecs: SUPPORTED_CODECS,
    })

    logger.info('Router created for room', { roomId, codecCount: router.rtpCapabilities.codecs?.length || 0 })

    // Initialize room state
    const room: MediaSoupRoom = {
      router,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    }

    rooms.set(roomId, room)

    return {
      router,
      rtpCapabilities: router.rtpCapabilities,
    }
  } catch (error) {
    logger.error('Failed to create router for room', error, { roomId })
    throw error
  }
}

/**
 * Get router for a room
 * @param roomId - The room ID
 * @returns Router instance or undefined
 */
export function getRoomRouter(roomId: string): Router | undefined {
  const room = rooms.get(roomId)
  return room?.router
}

/**
 * Close and remove a room's router
 * @param roomId - The room ID
 */
export async function closeRoomRouter(roomId: string): Promise<void> {
  const room = rooms.get(roomId)
  if (!room) {
    logger.warn('Room not found, cannot close router', { roomId })
    return
  }

  try {
    // Close all transports
    for (const [socketId, transport] of room.transports) {
      await closeTransport(roomId, socketId)
    }

    // Close router
    await room.router.close()

    // Remove room from state
    rooms.delete(roomId)

    logger.info('Router closed for room', { roomId })
  } catch (error) {
    logger.error('Failed to close router for room', error, { roomId })
    throw error
  }
}

// ============================================================================
// WebRTC Transport Management
// ============================================================================

/**
 * Create a WebRTC transport for a client
 * @param roomId - The room ID
 * @param options - Transport options (socketId, forceTcp)
 * @returns Transport info (id, ICE parameters, ICE candidates, DTLS parameters)
 */
export async function createWebRtcTransport(
  roomId: string,
  options: TransportOptions
): Promise<{
  id: string
  iceParameters: any
  iceCandidates: any[]
  dtlsParameters: any
}> {
  const room = rooms.get(roomId)
  if (!room) {
    throw new Error(`Room ${roomId} not found`)
  }

  try {
    const publicIp = process.env.PUBLIC_IP

    // Create WebRTC transport
    const transport = await room.router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: publicIp || undefined, // Public IP for ICE candidates
        },
      ],
      enableUdp: !options.forceTcp,
      enableTcp: true,
      preferUdp: !options.forceTcp,
      enableSctp: true, // Data channel for chat
    })

    logger.debug('WebRTC transport created', {
      socketId: options.socketId,
      roomId,
      transportId: transport.id,
      forceTcp: options.forceTcp
    })

    // Store transport in room state
    room.transports.set(options.socketId, transport)

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    }
  } catch (error) {
    logger.error('Failed to create WebRTC transport for socket', error, {
      socketId: options.socketId,
      roomId
    })
    throw error
  }
}

/**
 * Get transport for a socket in a room
 * @param roomId - The room ID
 * @param socketId - The socket ID
 * @returns Transport instance or undefined
 */
export function getTransport(roomId: string, socketId: string): WebRtcTransport | undefined {
  const room = rooms.get(roomId)
  return room?.transports.get(socketId)
}

/**
 * Close a transport and clean up associated producers/consumers
 * @param roomId - The room ID
 * @param socketId - The socket ID
 */
export async function closeTransport(roomId: string, socketId: string): Promise<void> {
  const room = rooms.get(roomId)
  if (!room) {
    logger.warn('Room not found, cannot close transport', { roomId })
    return
  }

  const transport = room.transports.get(socketId)
  if (!transport) {
    logger.warn('Transport not found in room', { socketId, roomId })
    return
  }

  try {
    // Get byte counts before closing for bandwidth tracking
    const bytesRelayed = transport.bytesRelayed || 0
    const bytesDirect = transport.bytesDirect || 0

    // Close all producers for this transport
    const producer = room.producers.get(socketId)
    if (producer) {
      await producer.close()
      room.producers.delete(socketId)
      logger.debug('Producer closed for socket', { socketId })
    }

    // Close all consumers for this user
    const consumers = room.consumers.get(socketId)
    if (consumers) {
      for (const consumer of consumers) {
        await consumer.close()
      }
      room.consumers.delete(socketId)
      logger.debug('Consumers closed for socket', { socketId, count: consumers.length })
    }

    // Close transport
    await transport.close()
    room.transports.delete(socketId)

    logger.info('Transport closed for socket in room', {
      socketId,
      roomId,
      bytesRelayed,
      bytesDirect
    })
  } catch (error) {
    logger.error('Failed to close transport in room', error, { socketId, roomId })
    throw error
  }
}

// ============================================================================
// Producer Management
// ============================================================================

/**
 * Create a producer for outgoing media stream (audio/video)
 * @param roomId - The room ID
 * @param options - Producer options (transportId, kind, rtpParameters)
 * @returns Producer ID
 */
export async function createProducer(
  roomId: string,
  options: ProducerOptions
): Promise<string> {
  const room = rooms.get(roomId)
  if (!room) {
    throw new Error(`Room ${roomId} not found`)
  }

  const transport = room.transports.get(options.transportId)
  if (!transport) {
    throw new Error(`Transport ${options.transportId} not found in room ${roomId}`)
  }

  try {
    const producer = await transport.produce({
      kind: options.kind,
      rtpParameters: options.rtpParameters,
      paused: options.paused || false,
    })

    logger.debug('Producer created for socket in room', {
      socketId: options.transportId,
      roomId,
      kind: options.kind,
      producerId: producer.id
    })

    // Store producer
    room.producers.set(options.transportId, producer)

    return producer.id
  } catch (error) {
    logger.error('Failed to create producer for socket', error, {
      socketId: options.transportId,
      roomId,
      kind: options.kind
    })
    throw error
  }
}

/**
 * Get producer by socket ID
 * @param roomId - The room ID
 * @param socketId - The socket ID
 * @returns Producer instance or undefined
 */
export function getProducer(roomId: string, socketId: string): Producer | undefined {
  const room = rooms.get(roomId)
  return room?.producers.get(socketId)
}

/**
 * Close a producer
 * @param roomId - The room ID
 * @param socketId - The socket ID
 */
export async function closeProducer(roomId: string, socketId: string): Promise<void> {
  const room = rooms.get(roomId)
  if (!room) {
    logger.warn('Room not found, cannot close producer', { roomId })
    return
  }

  const producer = room.producers.get(socketId)
  if (!producer) {
    logger.warn('Producer not found for socket in room', { socketId, roomId })
    return
  }

  try {
    await producer.close()
    room.producers.delete(socketId)
    logger.debug('Producer closed for socket in room', { socketId, roomId })
  } catch (error) {
    logger.error('Failed to close producer for socket in room', error, { socketId, roomId })
    throw error
  }
}

// ============================================================================
// Consumer Management
// ============================================================================

/**
 * Create a consumer for incoming media stream (audio/video from other participants)
 * @param roomId - The room ID
 * @param socketId - The socket ID of the consuming user
 * @param options - Consumer options (producerId, rtpCapabilities)
 * @returns Consumer info (id, producerId, kind, rtpParameters)
 */
export async function createConsumer(
  roomId: string,
  socketId: string,
  options: ConsumerOptions
): Promise<{
  id: string
  producerId: string
  kind: 'audio' | 'video'
  rtpParameters: any
}> {
  const room = rooms.get(roomId)
  if (!room) {
    throw new Error(`Room ${roomId} not found`)
  }

  // Find the producer
  let producer: Producer | undefined
  for (const [_, prod] of room.producers) {
    if (prod.id === options.producerId) {
      producer = prod
      break
    }
  }

  if (!producer) {
    throw new Error(`Producer ${options.producerId} not found in room ${roomId}`)
  }

  // Get transport for the consuming user
  const transport = room.transports.get(socketId)
  if (!transport) {
    throw new Error(`Transport ${socketId} not found in room ${roomId}`)
  }

  try {
    // Check if router can consume this producer
    if (!room.router.canConsume({
      producerId: options.producerId,
      rtpCapabilities: options.rtpCapabilities,
    })) {
      throw new Error(`Router cannot consume producer ${options.producerId} with given RTP capabilities`)
    }

    const consumer = await transport.consume({
      producerId: options.producerId,
      rtpCapabilities: options.rtpCapabilities,
      paused: true, // Start paused, client will resume
    })

    logger.debug('Consumer created for socket in room', {
      socketId,
      roomId,
      kind: consumer.kind,
      consumerId: consumer.id,
      producerId: options.producerId
    })

    // Store consumer
    if (!room.consumers.has(socketId)) {
      room.consumers.set(socketId, [])
    }
    room.consumers.get(socketId)!.push(consumer)

    return {
      id: consumer.id,
      producerId: producer.id,
      kind: consumer.kind as 'audio' | 'video',
      rtpParameters: consumer.rtpParameters,
    }
  } catch (error) {
    logger.error('Failed to create consumer for socket', error, {
      socketId,
      roomId,
      producerId: options.producerId
    })
    throw error
  }
}

/**
 * Get all consumers for a user
 * @param roomId - The room ID
 * @param socketId - The socket ID
 * @returns Array of consumer instances
 */
export function getConsumers(roomId: string, socketId: string): Consumer[] {
  const room = rooms.get(roomId)
  return room?.consumers.get(socketId) || []
}

/**
 * Close all consumers for a user
 * @param roomId - The room ID
 * @param socketId - The socket ID
 */
export async function closeConsumers(roomId: string, socketId: string): Promise<void> {
  const room = rooms.get(roomId)
  if (!room) {
    logger.warn('Room not found, cannot close consumers', { roomId })
    return
  }

  const consumers = room.consumers.get(socketId)
  if (!consumers || consumers.length === 0) {
    logger.warn('No consumers found for socket in room', { socketId, roomId })
    return
  }

  try {
    for (const consumer of consumers) {
      await consumer.close()
    }
    room.consumers.delete(socketId)
    logger.debug('Consumers closed for socket in room', { socketId, roomId, count: consumers.length })
  } catch (error) {
    logger.error('Failed to close consumers for socket in room', error, { socketId, roomId })
    throw error
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all producers in a room (for new participants to create consumers)
 * @param roomId - The room ID
 * @returns Array of producer info (id, userId, kind)
 */
export function getProducersInRoom(roomId: string): Array<{
  id: string
  socketId: string
  kind: 'audio' | 'video'
}> {
  const room = rooms.get(roomId)
  if (!room) {
    return []
  }

  const producers: Array<{
    id: string
    socketId: string
    kind: 'audio' | 'video'
  }> = []

  for (const [socketId, producer] of room.producers) {
    producers.push({
      id: producer.id,
      socketId,
      kind: producer.kind as 'audio' | 'video',
    })
  }

  return producers
}

/**
 * Get room statistics (for monitoring/debugging)
 * @param roomId - The room ID
 * @returns Room stats (transport count, producer count, consumer count)
 */
export function getRoomStats(roomId: string): {
  transports: number
  producers: number
  consumers: number
} | null {
  const room = rooms.get(roomId)
  if (!room) {
    return null
  }

  let consumerCount = 0
  for (const consumers of room.consumers.values()) {
    consumerCount += consumers.length
  }

  return {
    transports: room.transports.size,
    producers: room.producers.size,
    consumers: consumerCount,
  }
}

/**
 * Get all active room IDs (for monitoring/debugging)
 * @returns Array of room IDs
 */
export function getActiveRoomIds(): string[] {
  return Array.from(rooms.keys())
}

// ============================================================================
// TURN Credential Generation
// ============================================================================

/**
 * Generate time-limited TURN credentials using coturn REST API
 * Based on TURN REST API specification (RFC 5766)
 * @param userId - The user ID requesting TURN credentials
 * @returns TURN credentials (username, password, ttl)
 */
export function generateTurnCredentials(userId: string): TurnCredentials {
  const TURN_SECRET = process.env.TURN_SECRET || 'default-secret-change-in-production'
  const TTL = 3600 // 1 hour

  // Generate username with timestamp
  const timestamp = Math.floor(Date.now() / 1000) + TTL
  const username = `${timestamp}:${userId}`

  // Generate password using HMAC-SHA1
  const hmac = crypto.createHmac('sha1', TURN_SECRET)
  hmac.update(username)
  const password = hmac.digest('base64')

  logger.debug('Generated TURN credentials for user', { userId, ttl: TTL })

  return {
    username,
    password,
    ttl: TTL,
  }
}

/**
 * Get ICE server configuration for WebRTC
 * Includes Google public STUN, self-hosted TURN, and fallback STUN servers
 * @param turnCredentials - Optional TURN credentials (if not provided, returns STUN-only config)
 * @returns RTCConfiguration['iceServers'] array
 */
export function getIceServers(turnCredentials?: TurnCredentials): RTCConfiguration['iceServers'] {
  const iceServers: RTCConfiguration['iceServers'] = [
    // Google public STUN (free, reliable)
    { urls: 'stun:stun.l.google.com:19302' },

    // Fallback STUN servers
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]

  // Add TURN server if credentials provided
  if (turnCredentials) {
    const turnServerUrl = process.env.TURN_SERVER_URL
    if (turnServerUrl) {
      iceServers.push({
        urls: `turn:${turnServerUrl}:3478`,
        username: turnCredentials.username,
        credential: turnCredentials.password,
      })
      logger.debug('Added TURN server to ICE config', { turnServerUrl })
    } else {
      logger.warn('TURN_SERVER_URL not configured, using STUN-only')
    }
  }

  return iceServers
}

// ============================================================================
// Cleanup
// ============================================================================

/**
 * Gracefully shutdown mediasoup worker
 * Called on server shutdown
 */
export async function shutdownMediasoup(): Promise<void> {
  if (!worker) {
    logger.debug('Mediasoup worker not running, skipping shutdown')
    return
  }

  try {
    // Close all rooms
    for (const roomId of rooms.keys()) {
      await closeRoomRouter(roomId)
    }

    // Close worker
    await worker.close()
    worker = null

    logger.info('Mediasoup worker shut down gracefully')
  } catch (error) {
    logger.error('Failed to shutdown mediasoup worker', error)
    throw error
  }
}
