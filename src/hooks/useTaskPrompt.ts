import { useState, useEffect } from 'react'
import { addMinutes, differenceInSeconds, differenceInMinutes } from 'date-fns'

export interface TaskPromptState {
  isPromptActive: boolean
  timeRemaining: number
  minutesRemaining: number
}

/**
 * Hook that manages the 5-minute task completion prompt.
 * Activates 5 minutes before session end.
 *
 * @param sessionStartTime - When the session started
 * @param durationMinutes - Session duration in minutes (default 45)
 */
export function useTaskPrompt(
  sessionStartTime: Date,
  durationMinutes: number = 45
): TaskPromptState {
  const [isPromptActive, setIsPromptActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [minutesRemaining, setMinutesRemaining] = useState(0)

  useEffect(() => {
    // Calculate session end time
    const endTime = addMinutes(sessionStartTime, durationMinutes)

    // Update timer every second
    const interval = setInterval(() => {
      const now = new Date()
      const remaining = differenceInSeconds(endTime, now)
      const minutes = differenceInMinutes(endTime, now)

      // Update state
      setTimeRemaining(Math.max(0, remaining))
      setMinutesRemaining(minutes)

      // Activate prompt when 5 minutes or less remaining
      // But only if session hasn't ended (remaining >= 0)
      if (minutes <= 5 && minutes >= 0) {
        setIsPromptActive(true)
      } else {
        setIsPromptActive(false)
      }

      // Clear interval when session ends
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime, durationMinutes])

  return {
    isPromptActive,
    timeRemaining,
    minutesRemaining,
  }
}
