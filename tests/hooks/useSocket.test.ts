import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSocket } from '@/hooks/useSocket'
import { useRoomStore } from '@/store/roomStore'

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockSocketOn = vi.fn()
const mockSocketOff = vi.fn()
const mockSocketDisconnect = vi.fn()

let mockSocketConnected = false
const mockSocket = {
  get connected() {
    return mockSocketConnected
  },
  on: mockSocketOn,
  off: mockSocketOff,
  disconnect: mockSocketDisconnect,
}

vi.mock('@/lib/socket', () => ({
  connectToRoom: vi.fn(() => mockSocket),
  disconnectFromRoom: vi.fn(),
  isConnectedTo: vi.fn(() => false),
}))

import { connectToRoom, disconnectFromRoom, isConnectedTo } from '@/lib/socket'

// ─── Helpers ───────────────────────────────────────────────────────────────

function getHandlerFor(eventName: string) {
  const call = mockSocketOn.mock.calls.find(([event]) => event === eventName)
  return call ? call[1] : null
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSocketConnected = false
    useRoomStore.getState().reset()
    vi.mocked(isConnectedTo).mockReturnValue(false)
    vi.mocked(connectToRoom).mockReturnValue(mockSocket as any)
  })

  afterEach(() => {
    useRoomStore.getState().reset()
  })

  it('connects to room when roomId is provided', () => {
    renderHook(() => useSocket('room-123'))
    expect(connectToRoom).toHaveBeenCalledWith('room-123')
  })

  it('does not connect when roomId is null', () => {
    renderHook(() => useSocket(null))
    expect(connectToRoom).not.toHaveBeenCalled()
  })

  it('does not reconnect if already connected to same room', () => {
    vi.mocked(isConnectedTo).mockReturnValue(true)
    renderHook(() => useSocket('room-123'))
    expect(connectToRoom).not.toHaveBeenCalled()
    expect(useRoomStore.getState().isConnected).toBe(true)
  })

  it('updates isConnected true on socket connect event', () => {
    renderHook(() => useSocket('room-123'))

    const connectHandler = getHandlerFor('connect')
    expect(connectHandler).toBeTruthy()

    act(() => {
      connectHandler()
    })

    expect(useRoomStore.getState().isConnected).toBe(true)
  })

  it('updates isConnected false on socket disconnect event', () => {
    renderHook(() => useSocket('room-123'))

    // First connect
    act(() => { getHandlerFor('connect')?.() })
    expect(useRoomStore.getState().isConnected).toBe(true)

    // Then disconnect
    act(() => { getHandlerFor('disconnect')?.() })
    expect(useRoomStore.getState().isConnected).toBe(false)
  })

  it('sets isConnecting false after connection established', () => {
    const { result } = renderHook(() => useSocket('room-123'))
    expect(result.current.isConnecting).toBe(true)

    act(() => { getHandlerFor('connect')?.() })
    expect(result.current.isConnecting).toBe(false)
  })

  it('sets isConnecting false on connect_error', () => {
    const { result } = renderHook(() => useSocket('room-123'))
    expect(result.current.isConnecting).toBe(true)

    act(() => { getHandlerFor('connect_error')?.(new Error('refused')) })
    expect(result.current.isConnecting).toBe(false)
  })

  it('disconnect function disconnects and resets store', () => {
    const { result } = renderHook(() => useSocket('room-123'))

    act(() => { getHandlerFor('connect')?.() })

    act(() => { result.current.disconnect() })

    expect(disconnectFromRoom).toHaveBeenCalledWith('room-123')
    expect(useRoomStore.getState().isConnected).toBe(false)
  })

  it('removes event listeners on unmount', () => {
    const { unmount } = renderHook(() => useSocket('room-123'))
    unmount()
    expect(mockSocketOff).toHaveBeenCalledWith('connect', expect.any(Function))
    expect(mockSocketOff).toHaveBeenCalledWith('disconnect', expect.any(Function))
    expect(mockSocketOff).toHaveBeenCalledWith('connect_error', expect.any(Function))
  })

  it('sets isConnected immediately if socket already connected at mount', () => {
    mockSocketConnected = true
    renderHook(() => useSocket('room-123'))
    expect(useRoomStore.getState().isConnected).toBe(true)
  })
})
