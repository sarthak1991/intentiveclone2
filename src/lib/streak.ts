import { startOfDay, subDays, differenceInDays } from 'date-fns'
import { format } from 'date-fns-tz'
import { SessionCompletion } from '@/models/SessionCompletion'
import { Streak, IStreak } from '@/models/Streak'

export interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastSessionDate: Date | null
  streakMessage: string
}

/**
 * Calculate user's streak based on completed sessions.
 * Streak breaks when there's a gap > 1 day between completed sessions.
 *
 * @param userId - User's ID
 * @param userTimezone - User's timezone (optional, defaults to UTC)
 * @returns StreakInfo with currentStreak, longestStreak, lastSessionDate, streakMessage
 */
export async function calculateStreak(
  userId: string,
  userTimezone?: string
): Promise<StreakInfo> {
  // Query completed sessions, sorted by attendedAt descending
  const completions = await SessionCompletion.find({
    userId,
    completed: true,
    attendedAt: { $exists: true },
  })
    .sort({ attendedAt: -1 })
    .limit(365) // Look back up to a year
    .lean()

  // If no completions, return zero streak
  if (!completions || completions.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
      streakMessage: 'Ready to start a new streak!',
    }
  }

  // Group completions by date (using user's timezone if provided)
  const datesAttended = new Set<string>()

  for (const completion of completions) {
    const date = completion.attendedAt!
    // Convert to user's timezone for accurate day grouping
    const dateStr = userTimezone
      ? format(date, 'yyyy-MM-dd', { timeZone: userTimezone })
      : format(startOfDay(date), 'yyyy-MM-dd')

    datesAttended.add(dateStr)
  }

  // Convert to sorted array (most recent first)
  const sortedDates = Array.from(datesAttended).sort().reverse()

  // Calculate current streak
  let currentStreak = 0
  const today = userTimezone
    ? format(new Date(), 'yyyy-MM-dd', { timeZone: userTimezone })
    : format(startOfDay(new Date()), 'yyyy-MM-dd')

  // Check if streak is still active (attended today or yesterday)
  if (sortedDates.length > 0) {
    const mostRecent = sortedDates[0]
    const todayDate = new Date(today)
    const mostRecentDate = new Date(mostRecent)

    // Calculate difference in days
    const daysDiff = Math.abs(
      differenceInDays(startOfDay(todayDate), startOfDay(mostRecentDate))
    )

    // Streak continues if attended today or yesterday (gap <= 1)
    if (daysDiff <= 1) {
      currentStreak = 1

      // Count consecutive days going backwards
      for (let i = 0; i < sortedDates.length - 1; i++) {
        const currentDate = new Date(sortedDates[i])
        const nextDate = new Date(sortedDates[i + 1])
        const dayDiff = differenceInDays(startOfDay(currentDate), startOfDay(nextDate))

        // If consecutive (gap = 1 day), increment
        if (dayDiff === 1) {
          currentStreak++
        } else {
          // Gap > 1, streak broken
          break
        }
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 1

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDate = new Date(sortedDates[i])
    const nextDate = new Date(sortedDates[i + 1])
    const dayDiff = differenceInDays(startOfDay(currentDate), startOfDay(nextDate))

    if (dayDiff === 1) {
      tempStreak++
    } else {
      // Streak broken
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

  // Update or create Streak record
  let streakRecord = await Streak.findOne({ userId })
  if (streakRecord) {
    streakRecord.currentStreak = currentStreak
    streakRecord.longestStreak = Math.max(streakRecord.longestStreak, longestStreak)
    streakRecord.lastSessionDate = completions[0].attendedAt
    await streakRecord.save()
  } else {
    await Streak.create({
      userId,
      currentStreak,
      longestStreak,
      lastSessionDate: completions[0].attendedAt,
    })
  }

  // Generate streak message
  let streakMessage: string
  if (currentStreak === 0) {
    streakMessage = 'Ready to start a new streak!'
  } else if (currentStreak === 1) {
    streakMessage = '1 day streak! Keep it up!'
  } else {
    streakMessage = `${currentStreak} day streak! Keep it up!`
  }

  return {
    currentStreak,
    longestStreak,
    lastSessionDate: completions[0].attendedAt,
    streakMessage,
  }
}

/**
 * Update user's streak after completing a session.
 * Call this after a user attends a session.
 */
export async function updateStreakAfterSession(
  userId: string,
  attendedAt: Date
): Promise<IStreak> {
  const streakInfo = await calculateStreak(userId)

  const streakRecord = await Streak.findOne({ userId })

  if (streakRecord) {
    return streakRecord
  } else {
    // Create new record
    return await Streak.create({
      userId,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      lastSessionDate: attendedAt,
    })
  }
}
