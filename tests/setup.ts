import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { ObjectId } from 'mongodb'

expect.extend(matchers)

afterEach(() => {
  cleanup()
})

// ============================================================================
// WebRTC Test Mocks and Fixtures
// ============================================================================

/**
 * Mock getUserMedia for camera/microphone access
 * Tests should override this with vi.spyOn() for specific test scenarios
 */
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() =>
      Promise.resolve({
        getAudioTracks: () => [{ enabled: true, stop: vi.fn(), id: 'audio-track-1' }],
        getVideoTracks: () => [{ enabled: true, stop: vi.fn(), id: 'video-track-1' }],
        getTracks: () => [],
      })
    ),
  },
  writable: true,
})

/**
 * Mock RTCPeerConnection (WebRTC peer connection)
 */
global.RTCPeerConnection = vi.fn(() => ({
  createOffer: vi.fn(() => Promise.resolve({})),
  createAnswer: vi.fn(() => Promise.resolve({})),
  setLocalDescription: vi.fn(() => Promise.resolve()),
  setRemoteDescription: vi.fn(() => Promise.resolve()),
  addIceCandidate: vi.fn(() => Promise.resolve()),
  getStats: vi.fn(() => Promise.resolve(new Map())),
  close: vi.fn(),
  addTrack: vi.fn(),
  addTransceiver: vi.fn(),
})) as any

/**
 * Mock MediaStream
 */
global.MediaStream = vi.fn(() => ({
  getAudioTracks: () => [{ enabled: true, stop: vi.fn() }],
  getVideoTracks: () => [{ enabled: true, stop: vi.fn() }],
  getTracks: () => [],
})) as any

/**
 * Mock mediasoup (server-side SFU)
 */
vi.mock('mediasoup', () => ({
  createWorker: vi.fn(() => Promise.resolve(mockWorker)),
  getSupportedRtpCapabilities: vi.fn(() => ({})),
}))

/**
 * Mock mediasoup-client (browser-side WebRTC client)
 */
vi.mock('mediasoup-client', () => ({
  Device: vi.fn(() => mockDevice),
  types: {
    supported: true,
  },
}))

/**
 * Mock Socket.IO client
 */
vi.mock('@/lib/socket', () => ({
  socket: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    connected: false,
  },
}))

// ============================================================================
// Mock Objects
// ============================================================================

/**
 * Mock mediasoup Worker
 */
export const mockWorker = {
  close: vi.fn(),
  createRouter: vi.fn(() => Promise.resolve(mockRouter)),
  on: vi.fn(),
}

/**
 * Mock mediasoup Router
 */
export const mockRouter = {
  close: vi.fn(),
  createWebRtcTransport: vi.fn(() => Promise.resolve(mockTransport)),
  createPlainTransport: vi.fn(() => Promise.resolve(mockTransport)),
  addProducer: vi.fn(),
  removeProducer: vi.fn(),
  addConsumer: vi.fn(),
  removeConsumer: vi.fn(),
}

/**
 * Mock WebRTC Transport
 */
export const mockTransport = {
  id: 'transport-1',
  close: vi.fn(),
  connect: vi.fn(() => Promise.resolve()),
  produce: vi.fn(() => Promise.resolve(mockProducer)),
  consume: vi.fn(() => Promise.resolve(mockConsumer)),
  on: vi.fn(),
}

/**
 * Mock Producer (outgoing audio/video stream)
 */
export const mockProducer = {
  id: 'producer-1',
  kind: 'audio' as const,
  close: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  replaceTrack: vi.fn(() => Promise.resolve()),
  getStats: vi.fn(() => Promise.resolve(new Map())),
}

/**
 * Mock Consumer (incoming audio/video stream)
 */
export const mockConsumer = {
  id: 'consumer-1',
  kind: 'audio' as const,
  producerId: 'producer-1',
  close: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getStats: vi.fn(() => Promise.resolve(new Map())),
}

/**
 * Mock mediasoup-client Device
 */
export const mockDevice = {
  loaded: false,
  load: vi.fn(() => Promise.resolve()),
  rtpCapabilities: {},
  createSendTransport: vi.fn(() => mockTransport),
  createRecvTransport: vi.fn(() => mockTransport),
  canProduce: vi.fn(() => true),
}

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Mock Room document for testing
 */
export const mockRoom = {
  _id: new ObjectId(),
  name: '9:00 AM Focus Room',
  capacity: 12,
  isOverflowRoom: false,
  overflowRoomId: null,
  startTime: new Date('2025-04-07T09:00:00Z'),
  endTime: new Date('2025-04-07T09:45:00Z'),
  interests: ['productivity', 'adhd'],
  isActive: true,
}

/**
 * Mock User document for testing
 */
export const mockUser = {
  _id: new ObjectId(),
  name: 'Test User',
  email: 'test@example.com',
  photo: null,
  timezone: 'Asia/Kolkata',
  interests: ['productivity'],
  completedSessions: 5,
  createdAt: new Date(),
}

/**
 * Mock Participant for video room
 */
export const mockParticipant = {
  userId: mockUser._id.toString(),
  name: mockUser.name,
  photo: mockUser.photo,
  isCaptain: false,
  isMuted: false,
  isVideoOff: false,
  joinedAt: new Date(),
}

/**
 * Mock MediaStream for testing
 */
export const mockMediaStream = {
  id: 'stream-1',
  getAudioTracks: () => [
    {
      id: 'audio-track-1',
      enabled: true,
      kind: 'audio',
      stop: vi.fn(),
    },
  ],
  getVideoTracks: () => [
    {
      id: 'video-track-1',
      enabled: true,
      kind: 'video',
      stop: vi.fn(),
    },
  ],
  getTracks: () => [],
  addTrack: vi.fn(),
  removeTrack: vi.fn(),
}

/**
 * Mock Socket.IO server event tracking
 */
export const mockSocketEvents: Record<string, any[]> = {}

export function trackSocketEvents() {
  const { socket } = require('@/lib/socket')
  socket.emit = vi.fn((event: string, data: any) => {
    if (!mockSocketEvents[event]) {
      mockSocketEvents[event] = []
    }
    mockSocketEvents[event].push(data)
  })
  return mockSocketEvents
}

export function clearMockSocketEvents() {
  Object.keys(mockSocketEvents).forEach((key) => {
    delete mockSocketEvents[key]
  })
}

// ============================================================================
// Cleanup
// ============================================================================

afterEach(() => {
  // Clear all mocks after each test
  vi.clearAllMocks()
  clearMockSocketEvents()
})
