import { useState, useEffect, useCallback } from 'react'

export interface StreakData {
  currentStreak: number
  longestStreak: number
  lastSessionDate: Date | null
  streakMessage: string
}

export interface UseStreakResult {
  streak: number
  longestStreak: number
  streakMessage: string
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

/**
 * Hook for fetching and managing user's streak data.
 */
export function useStreak(userId: string | null): UseStreakResult {
  const [streak, setStreak] = useState<number>(0)
  const [longestStreak, setLongestStreak] = useState<number>(0)
  const [streakMessage, setStreakMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStreak = useCallback(async () => {
    if (!userId) {
      setStreak(0)
      setLongestStreak(0)
      setStreakMessage('')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/streak')
      const data = await response.json()

      if (data.success) {
        setStreak(data.currentStreak)
        setLongestStreak(data.longestStreak)
        setStreakMessage(data.streakMessage)
      } else {
        setError(data.error || 'Failed to fetch streak')
      }
    } catch (err) {
      setError('Failed to fetch streak')
      console.error('Error fetching streak:', err)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStreak()
  }, [fetchStreak])

  return {
    streak,
    longestStreak,
    streakMessage,
    isLoading,
    error,
    refresh: fetchStreak,
  }
}
