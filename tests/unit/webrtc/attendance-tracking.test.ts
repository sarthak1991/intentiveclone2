/**
 * Unit tests for useAttendanceTracking hook
 *
 * Tests 90-second attendance threshold tracking (ROOM-08).
 * Tracks cumulative time across connections/disconnections.
 */

import { renderHook, waitFor } from '@testing-library/react'
import { useAttendanceTracking } from '@/hooks/useAttendanceTracking'

// Mock Socket.IO
vi.mock('@/lib/socket', () => ({
  socket: {
    emit: vi.fn(),
  },
}))

// Mock roomStore
vi.mock('@/store/roomStore', () => ({
  useRoomStore: vi.fn((selector) => {
    const state = {
      attendedSessions: new Set<string>(),
      setAttendedSession: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

describe('useAttendanceTracking', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('attendance tracking starts on connect', () => {
    it('should initialize with no attendance and zero time', () => {
      const { result } = renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: false })
      )

      expect(result.current.hasAttended).toBe(false)
      expect(result.current.cumulativeTime).toBe(0)
    })

    it('should start tracking when connected', () => {
      const { result } = renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: true })
      )

      expect(result.current.hasAttended).toBe(false)
      expect(result.current.cumulativeTime).toBe(0)
    })

    it('should accumulate time while connected', () => {
      const { result } = renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: true })
      )

      // Advance 30 seconds
      vi.advanceTimersByTime(30 * 1000)

      // Check cumulative time
      expect(result.current.cumulativeTime).toBe(30)
    })
  })

  describe('attendance pauses on disconnect', () => {
    it('should pause tracking on disconnect', () => {
      const { result, rerender } = renderHook(
        ({ isConnected }) => useAttendanceTracking({ sessionId: 'session-1', isConnected }),
        { initialProps: { isConnected: true } }
      )

      // Advance 30 seconds while connected
      vi.advanceTimersByTime(30 * 1000)
      expect(result.current.cumulativeTime).toBe(30)

      // Disconnect
      rerender({ isConnected: false })

      // Advance 10 more seconds while disconnected
      vi.advanceTimersByTime(10 * 1000)

      // Cumulative time should still be 30 (not 40)
      expect(result.current.cumulativeTime).toBe(30)
    })
  })

  describe('attendance resumes on reconnect', () => {
    it('should resume tracking on reconnect', () => {
      const { result, rerender } = renderHook(
        ({ isConnected }) => useAttendanceTracking({ sessionId: 'session-1', isConnected }),
        { initialProps: { isConnected: true } }
      )

      // Connect for 30 seconds
      vi.advanceTimersByTime(30 * 1000)
      expect(result.current.cumulativeTime).toBe(30)

      // Disconnect for 10 seconds
      rerender({ isConnected: false })
      vi.advanceTimersByTime(10 * 1000)

      // Reconnect
      rerender({ isConnected: true })
      vi.advanceTimersByTime(60 * 1000)

      // Cumulative time should be 30 + 60 = 90
      expect(result.current.cumulativeTime).toBe(90)
    })
  })

  describe('hasAttended becomes true after 90 seconds', () => {
    it('should not attend before 90 seconds', () => {
      const { result } = renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: true })
      )

      vi.advanceTimersByTime(89 * 1000)

      expect(result.current.hasAttended).toBe(false)
    })

    it('should attend at exactly 90 seconds', () => {
      const { result } = renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: true })
      )

      vi.advanceTimersByTime(90 * 1000)

      expect(result.current.hasAttended).toBe(true)
    })

    it('should attend after 90 seconds', () => {
      const { result } = renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: true })
      )

      vi.advanceTimersByTime(100 * 1000)

      expect(result.current.hasAttended).toBe(true)
    })
  })

  describe('attendance confirmation sent once', () => {
    it('should emit attendance-confirmed event once', async () => {
      const { socket } = await import('@/lib/socket')

      renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: true })
      )

      // Advance to 90 seconds
      vi.advanceTimersByTime(90 * 1000)

      // Wait for interval to fire
      await waitFor(() => {
        expect(socket.emit).toHaveBeenCalledWith('attendance-confirmed', {
          sessionId: 'session-1',
          cumulativeTime: 90,
        })
      })
    })

    it('should not emit attendance-confirmed again', async () => {
      const { socket } = await import('@/lib/socket')

      renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: true })
      )

      // Advance past threshold
      vi.advanceTimersByTime(100 * 1000)

      await waitFor(() => {
        expect(socket.emit).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('attendance state persistence', () => {
    it('should restore attendance from room store', async () => {
      const { useRoomStore } = await import('@/store/roomStore')

      // Mock session already attended
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          attendedSessions: new Set(['session-1']),
          setAttendedSession: vi.fn(),
        }
        return selector ? selector(state) : state
      })

      const { result } = renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: false })
      )

      // Should immediately show as attended
      expect(result.current.hasAttended).toBe(true)
    })

    it('should store attended session in room store', async () => {
      const { socket } = await import('@/lib/socket')
      const { useRoomStore } = await import('@/store/roomStore')

      let setAttendedSessionCalled = false

      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          attendedSessions: new Set<string>(),
          setAttendedSession: (sessionId: string) => {
            setAttendedSessionCalled = true
            state.attendedSessions.add(sessionId)
          },
        }
        return selector ? selector(state) : state
      })

      renderHook(() =>
        useAttendanceTracking({ sessionId: 'session-1', isConnected: true })
      )

      // Advance to 90 seconds
      vi.advanceTimersByTime(90 * 1000)

      await waitFor(() => {
        expect(setAttendedSessionCalled).toBe(true)
      })
    })
  })

  describe('cumulative time tracking', () => {
    it('should track time across multiple connections', () => {
      const { result, rerender } = renderHook(
        ({ isConnected }) => useAttendanceTracking({ sessionId: 'session-1', isConnected }),
        { initialProps: { isConnected: true } }
      )

      // First connection: 30 seconds
      vi.advanceTimersByTime(30 * 1000)
      rerender({ isConnected: false })

      // Disconnected: 10 seconds (not counted)
      vi.advanceTimersByTime(10 * 1000)

      // Second connection: 40 seconds
      rerender({ isConnected: true })
      vi.advanceTimersByTime(40 * 1000)
      rerender({ isConnected: false })

      // Disconnected: 5 seconds (not counted)
      vi.advanceTimersByTime(5 * 1000)

      // Third connection: 20 seconds
      rerender({ isConnected: true })
      vi.advanceTimersByTime(20 * 1000)

      // Total: 30 + 40 + 20 = 90 seconds
      expect(result.current.cumulativeTime).toBe(90)
      expect(result.current.hasAttended).toBe(true)
    })
  })
})
