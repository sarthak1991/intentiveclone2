"use client"

import { useStreak } from '@/hooks/useStreak'
import { useSession } from 'next-auth/react'

export interface StreakBadgeProps {
  variant?: 'nav' | 'card'
  userId?: string
}

/**
 * Streak badge component showing 🔥 N when user has active streak.
 * Hides when streak is 0 to avoid discouragement.
 *
 * Nav variant: Small badge for navigation header
 * Card variant: Larger display for profile pages
 */
export function StreakBadge({ variant = 'nav', userId }: StreakBadgeProps) {
  const { data: session } = useSession()
  const effectiveUserId = userId || session?.user?.id || null
  const { streak, isLoading } = useStreak(effectiveUserId)

  // Hide when loading or streak is 0 (don't show zero streak per D-09)
  if (isLoading || streak === 0) {
    return null
  }

  if (variant === 'nav') {
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
        <span>🔥</span>
        <span>{streak}</span>
      </div>
    )
  }

  // Card variant - larger format
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg">
      <span className="text-2xl">🔥</span>
      <div>
        <p className="text-xs text-orange-600 font-medium">Current Streak</p>
        <p className="text-lg font-bold">{streak} days</p>
      </div>
    </div>
  )
}
