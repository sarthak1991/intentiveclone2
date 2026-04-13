import { useState, useEffect, useRef } from 'react'
import { useRoomStore } from '@/store/roomStore'
import type { Socket } from '@/lib/socket'

interface UseAttendanceTrackingParams {
  sessionId: string
  isConnected: boolean
  socket?: Socket
}

interface UseAttendanceTrackingReturn {
  hasAttended: boolean
  cumulativeTime: number
}

/**
 * Attendance tracking hook with 90-second threshold (ROOM-08, D-13)
 *
 * Tracks cumulative time in session across connections/disconnections.
 * When user reaches 90 seconds total, marks as attended and confirms with server.
 *
 * @param sessionId - The session/room ID
 * @param isConnected - WebRTC connection state
 * @param socket - Optional socket instance for emitting events
 * @returns Attendance status and cumulative time in seconds
 */
export function useAttendanceTracking({
  sessionId,
  isConnected,
  socket
}: UseAttendanceTrackingParams): UseAttendanceTrackingReturn {
  const [hasAttended, setHasAttended] = useState(false)
  const cumulativeTimeRef = useRef(0)
  const lastConnectTimeRef = useRef<number | null>(null)
  const attendanceConfirmedRef = useRef(false)

  // Restore attendance state from room store (persists across page refreshes)
  const attendedSessions = useRoomStore((state) => state.attendedSessions || new Set())
  const setAttendedSession = useRoomStore((state) => state.setAttendedSession)

  // Check if user already attended this session
  useEffect(() => {
    if (attendedSessions.has(sessionId)) {
      setHasAttended(true)
      attendanceConfirmedRef.current = true
    }
  }, [sessionId, attendedSessions])

  // Track cumulative time per D-13
  useEffect(() => {
    if (attendanceConfirmedRef.current) {
      // Already attended - no need to track
      return
    }

    if (!isConnected) {
      // Pause tracking on disconnect
      if (lastConnectTimeRef.current !== null) {
        cumulativeTimeRef.current += Date.now() - lastConnectTimeRef.current
        lastConnectTimeRef.current = null
      }
      return
    }

    // Start/resume tracking on connect
    lastConnectTimeRef.current = Date.now()

    const ATTENDANCE_THRESHOLD = 90 // seconds
    const CHECK_INTERVAL_MS = 1000 // Check every second

    const interval = setInterval(() => {
      if (lastConnectTimeRef.current !== null) {
        const totalMs = cumulativeTimeRef.current + (Date.now() - lastConnectTimeRef.current)
        const totalSeconds = Math.floor(totalMs / 1000)

        // Check if threshold reached
        if (totalSeconds >= ATTENDANCE_THRESHOLD && !hasAttended) {
          setHasAttended(true)
          attendanceConfirmedRef.current = true

          // Send attendance confirmation to server if socket is available
          if (socket) {
            socket.emit('attendance-confirmed', {
              sessionId: sessionId,
              cumulativeTime: totalSeconds
            })
          }

          // Store in room store for persistence
          setAttendedSession(sessionId)

          console.log(`Attendance confirmed for session ${sessionId} (${totalSeconds}s)`)
        }
      }
    }, CHECK_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isConnected, hasAttended, sessionId, setAttendedSession, socket])

  return {
    hasAttended,
    cumulativeTime: Math.floor(cumulativeTimeRef.current / 1000)
  }
}
