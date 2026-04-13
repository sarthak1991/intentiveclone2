import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRoomPresence } from '@/hooks/useRoomPresence'
import { useRoomStore } from '@/store/roomStore'

// ─── Mocks ─────────────────────────────────────────────────────────────────

const mockSocketOn = vi.fn()
const mockSocketOff = vi.fn()
const mockSocketEmit = vi.fn()
let mockSocketConnected = false
const mockSocket = {
  get connected() {
    return mockSocketConnected
  },
  on: mockSocketOn,
  off: mockSocketOff,
  emit: mockSocketEmit,
}

vi.mock('@/lib/socket', () => ({
  connectToRoom: vi.fn(() => mockSocket),
  disconnectFromRoom: vi.fn(),
  isConnectedTo: vi.fn(() => false),
}))

import { connectToRoom, disconnectFromRoom } from '@/lib/socket'

// ─── Helpers ───────────────────────────────────────────────────────────────

function getHandlerFor(eventName: string) {
  const call = mockSocketOn.mock.calls.find(([event]) => event === eventName)
  return call ? call[1] : null
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('useRoomPresence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mockSocketConnected = false
    useRoomStore.getState().reset()
    vi.mocked(connectToRoom).mockReturnValue(mockSocket as any)
  })

  afterEach(() => {
    vi.useRealTimers()
    useRoomStore.getState().reset()
  })

  it('connects to room on mount', () => {
    renderHook(() => useRoomPresence('room-123'))
    expect(connectToRoom).toHaveBeenCalledWith('room-123')
  })

  it('starts heartbeat interval (15s) after connect', () => {
    renderHook(() => useRoomPresence('room-123'))

    const connectHandler = getHandlerFor('connect')
    expect(connectHandler).toBeTruthy()

    // Simulate socket connected so emit guard passes
    mockSocketConnected = true

    act(() => {
      connectHandler()
    })

    // No heartbeat yet
    expect(mockSocketEmit).not.toHaveBeenCalledWith('heartbeat', expect.anything())

    // Advance 15 seconds
    act(() => {
      vi.advanceTimersByTime(15000)
    })

    expect(mockSocketEmit).toHaveBeenCalledWith('heartbeat', expect.objectContaining({ roomId: 'room-123' }))
  })

  it('clears heartbeat interval on disconnect', () => {
    renderHook(() => useRoomPresence('room-123'))

    mockSocketConnected = true
    act(() => { getHandlerFor('connect')?.() })

    // Advance 10s — no heartbeat yet
    act(() => { vi.advanceTimersByTime(10000) })
    expect(mockSocketEmit).not.toHaveBeenCalledWith('heartbeat', expect.anything())

    // Disconnect clears interval
    act(() => { getHandlerFor('disconnect')?.() })

    // Advance past 15s — still no heartbeat since interval was cleared
    act(() => { vi.advanceTimersByTime(10000) })
    expect(mockSocketEmit).not.toHaveBeenCalledWith('heartbeat', expect.anything())
  })

  it('clears heartbeat interval on unmount', () => {
    const { unmount } = renderHook(() => useRoomPresence('room-123'))

    mockSocketConnected = true
    act(() => { getHandlerFor('connect')?.() })

    // Unmount
    unmount()

    // Advance past 15s — interval should be cleared, no heartbeat
    act(() => { vi.advanceTimersByTime(20000) })
    expect(mockSocketEmit).not.toHaveBeenCalledWith('heartbeat', expect.anything())
  })

  it('adds participant on user-joined event', () => {
    renderHook(() => useRoomPresence('room-123'))

    const handler = getHandlerFor('user-joined')
    expect(handler).toBeTruthy()

    act(() => {
      handler({ userId: 'u1', userName: 'Alice', userPhoto: 'photo.jpg' })
    })

    const { participants } = useRoomStore.getState()
    expect(participants).toHaveLength(1)
    expect(participants[0]).toEqual({ userId: 'u1', userName: 'Alice', userPhoto: 'photo.jpg' })
  })

  it('removes participant on user-left event', () => {
    // Seed store with a participant
    act(() => {
      useRoomStore.getState().addParticipant({ userId: 'u1', userName: 'Alice' })
    })

    renderHook(() => useRoomPresence('room-123'))

    const handler = getHandlerFor('user-left')
    expect(handler).toBeTruthy()

    act(() => {
      handler({ userId: 'u1' })
    })

    const { participants } = useRoomStore.getState()
    expect(participants).toHaveLength(0)
  })

  it('replaces participant list on presence-update event', () => {
    // Seed store with existing participants
    act(() => {
      useRoomStore.getState().addParticipant({ userId: 'old1', userName: 'Old User' })
    })

    renderHook(() => useRoomPresence('room-123'))

    const handler = getHandlerFor('presence-update')
    expect(handler).toBeTruthy()

    act(() => {
      handler({
        participants: [
          { userId: 'u1', userName: 'Alice' },
          { userId: 'u2', userName: 'Bob', userPhoto: 'bob.jpg' },
        ],
      })
    })

    const { participants } = useRoomStore.getState()
    expect(participants).toHaveLength(2)
    expect(participants[0]).toEqual({ userId: 'u1', userName: 'Alice', userPhoto: undefined })
    expect(participants[1]).toEqual({ userId: 'u2', userName: 'Bob', userPhoto: 'bob.jpg' })
  })

  it('replaces participant list on presence-sync event', () => {
    // Seed store with existing participants
    act(() => {
      useRoomStore.getState().addParticipant({ userId: 'old1', userName: 'Old User' })
    })

    renderHook(() => useRoomPresence('room-123'))

    const handler = getHandlerFor('presence-sync')
    expect(handler).toBeTruthy()

    act(() => {
      handler({
        participants: [{ userId: 'u3', userName: 'Charlie' }],
      })
    })

    const { participants } = useRoomStore.getState()
    expect(participants).toHaveLength(1)
    expect(participants[0]).toEqual({ userId: 'u3', userName: 'Charlie', userPhoto: undefined })
  })

  it('emits fetch-presence on request-state-sync event', () => {
    renderHook(() => useRoomPresence('room-123'))

    const handler = getHandlerFor('request-state-sync')
    expect(handler).toBeTruthy()

    act(() => {
      handler()
    })

    expect(mockSocketEmit).toHaveBeenCalledWith('fetch-presence', { roomId: 'room-123' })
  })

  it('cleans up all event listeners on unmount', () => {
    const { unmount } = renderHook(() => useRoomPresence('room-123'))
    unmount()

    const events = mockSocketOff.mock.calls.map(([event]) => event)
    expect(events).toContain('connect')
    expect(events).toContain('disconnect')
    expect(events).toContain('user-joined')
    expect(events).toContain('user-left')
    expect(events).toContain('presence-update')
    expect(events).toContain('presence-sync')
    expect(events).toContain('request-state-sync')
  })

  it('reconnect function calls disconnectFromRoom and resets store', () => {
    act(() => {
      useRoomStore.getState().addParticipant({ userId: 'u1', userName: 'Alice' })
      useRoomStore.getState().setConnected(true)
    })

    const { result } = renderHook(() => useRoomPresence('room-123'))

    act(() => {
      result.current.reconnect()
    })

    expect(disconnectFromRoom).toHaveBeenCalledWith('room-123')
    const state = useRoomStore.getState()
    expect(state.isConnected).toBe(false)
    expect(state.participants).toHaveLength(0)
    expect(state.roomId).toBeNull()
  })
})
