/**
 * SessionTimer Component
 *
 * 45-minute countdown timer for focus room sessions.
 * Implements D-08, D-09, D-10 from CONTEXT.md:
 * - Small sticker on header with accent color
 * - "... remaining" format (e.g., "42:15 remaining")
 * - No color change throughout session (accent color throughout)
 * - Consistent, less stressful for ADHD users
 *
 * @example
 * ```tsx
 * <SessionTimer startTime="2025-04-07T09:00:00Z" durationMinutes={45} />
 * ```
 */

'use client'

import { useState, useEffect } from 'react'

interface SessionTimerProps {
  startTime: Date | string // ISO string or Date object
  durationMinutes?: number // Default: 45 minutes
}

export function SessionTimer({ startTime, durationMinutes = 45 }: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)

  useEffect(() => {
    // Parse start time
    const startDate = typeof startTime === 'string' ? new Date(startTime) : startTime

    // Calculate end time
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)

    // Initial calculation
    const calculateRemaining = () => {
      const now = new Date()
      const diff = Math.max(0, Math.floor((endDate.getTime() - now.getTime()) / 1000))
      setRemainingSeconds(diff)
    }

    calculateRemaining()

    // Update every second
    const interval = setInterval(calculateRemaining, 1000)

    // Cleanup
    return () => clearInterval(interval)
  }, [startTime, durationMinutes])

  /**
   * Format time as "MM:SS remaining" per D-09
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')} remaining`
  }

  return (
    <div className="text-sm font-semibold text-accent">
      {formatTime(remainingSeconds)}
    </div>
  )
}
