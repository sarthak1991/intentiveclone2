import { formatInTimeZone, toZonedTime } from 'date-fns-tz'
import { format, formatDistanceToNow } from 'date-fns'
import { IRoom, IUser } from '@/models/types'
import { User } from '@/models/User'
import mongoose from 'mongoose'

/**
 * Format a UTC date to the user's timezone for display
 * @param utcDate - The UTC date to format
 * @param userTimezone - The user's timezone (e.g., 'Asia/Kolkata', 'America/New_York')
 * @returns Formatted time string (e.g., '9:00 AM')
 */
export function formatRoomTime(utcDate: Date, userTimezone: string): string {
  try {
    return formatInTimeZone(utcDate, userTimezone, 'h:mm a')
  } catch (error) {
    // Fallback to UTC if timezone is invalid
    return format(utcDate, 'h:mm a') + ' UTC'
  }
}

// Alias for formatRoomTime for compatibility
export const formatDisplayTime = formatRoomTime

/**
 * Format a UTC date to the user's timezone with date
 * @param utcDate - The UTC date to format
 * @param userTimezone - The user's timezone
 * @returns Formatted date and time string (e.g., 'Apr 7, 2026, 9:00 AM')
 */
export function formatRoomDateTime(utcDate: Date, userTimezone: string): string {
  try {
    return formatInTimeZone(utcDate, userTimezone, 'MMM d, yyyy, h:mm a')
  } catch (error) {
    return format(utcDate, 'MMM d, yyyy, h:mm a') + ' UTC'
  }
}

/**
 * Get user's timezone from user object
 * @param user - The user object
 * @returns User's timezone or default to 'Asia/Kolkata' (IST)
 */
export function getUserTimezone(user: IUser): string {
  return user.timezone || 'Asia/Kolkata'
}

/**
 * Get user's timezone from database by userId
 * @param userId - The user's ObjectId
 * @returns User's timezone or default to 'UTC'
 */
export async function getUserTimezoneById(userId: mongoose.Types.ObjectId): Promise<string> {
  try {
    const user = await User.findById(userId).select('timezone')
    return user?.timezone || 'UTC'
  } catch (error) {
    console.error('[timezone] Error getting user timezone:', error)
    return 'UTC'
  }
}

/**
 * Convert a local time in user's timezone to UTC
 * @param localTime - Local time string (e.g., '2026-04-07 09:00')
 * @param userTimezone - User's timezone
 * @returns UTC Date object
 */
export function convertLocalToUTC(localTime: string, userTimezone: string): Date {
  try {
    // Parse the local time in the user's timezone, then convert to UTC
    const localDate = new Date(localTime)
    const zonedDate = toZonedTime(localDate, userTimezone)
    return new Date(zonedDate)
  } catch (error) {
    // Fallback to treating the time as UTC
    return new Date(localTime)
  }
}

/**
 * Convert UTC date to user's timezone for display
 * @param utcDate - UTC Date object
 * @param userTimezone - User's timezone
 * @returns Date object adjusted to user timezone
 */
export function convertUTCToUserTimezone(utcDate: Date, userTimezone: string): Date {
  try {
    return toZonedTime(utcDate, userTimezone)
  } catch (error) {
    console.error('[timezone] Error converting UTC to user timezone:', error)
    return utcDate
  }
}

/**
 * Check if a room is in the past relative to user's timezone
 * @param room - The room object
 * @param userTimezone - User's timezone
 * @returns True if room is in the past
 */
export function isRoomInPast(room: IRoom, userTimezone: string): boolean {
  const now = new Date()
  const roomEndTime = new Date(room.scheduledTime.getTime() + room.duration * 60 * 1000)
  return roomEndTime < now
}

/**
 * Get time remaining until room starts in user's timezone
 * @param room - The room object
 * @param userTimezone - User's timezone
 * @returns Formatted string like "Starts in 2 hours" or "Started 30 minutes ago"
 */
export function getTimeUntilRoom(room: IRoom, userTimezone: string): string {
  const now = new Date()
  const roomTime = room.scheduledTime

  if (roomTime < now) {
    return `Started ${formatDistanceToNow(roomTime, { addSuffix: true })}`
  }

  return `Starts ${formatDistanceToNow(roomTime, { addSuffix: true })}`
}

/**
 * Check if registration window is open (30 minutes before session)
 * @param room - The room object
 * @returns True if registration is open
 */
export function isRegistrationOpen(room: IRoom): boolean {
  const now = new Date()
  const thirtyMinBefore = new Date(room.scheduledTime.getTime() - 30 * 60 * 1000)
  return now >= thirtyMinBefore
}

/**
 * Get registration status for a room
 * Implements state machine from RESEARCH.md Pattern 4
 * @param room - The room object
 * @param user - Optional user object
 * @returns Registration status with message
 */
export function getRegistrationStatus(
  room: IRoom,
  user?: IUser
): {
  status: string
  canRegister: boolean
  message: string
} {
  const now = new Date()
  const sessionEnd = new Date(room.scheduledTime.getTime() + room.duration * 60 * 1000)
  const thirtyMinBefore = new Date(room.scheduledTime.getTime() - 30 * 60 * 1000)

  // Check if session already ended
  if (now > sessionEnd) {
    return {
      status: 'closed',
      canRegister: false,
      message: 'This session has ended'
    }
  }

  // Check if session is in progress
  if (now >= room.scheduledTime && room.status === 'in-progress') {
    return {
      status: 'in-progress',
      canRegister: false,
      message: 'This session is currently in progress'
    }
  }

  // Check if room is full
  if (room.participants.length >= room.capacity) {
    return {
      status: 'full',
      canRegister: false,
      message: 'This room is full'
    }
  }

  // Check if user is already registered
  if (user && room.participants.some(p => p.equals(user._id))) {
    return {
      status: 'registered',
      canRegister: false,
      message: 'You are registered for this session'
    }
  }

  // Check if registration window is open (30 min before session)
  if (now < thirtyMinBefore) {
    return {
      status: 'upcoming',
      canRegister: false,
      message: `Registration opens ${formatRoomTime(thirtyMinBefore, user?.timezone || 'UTC')}`
    }
  }

  // Registration is open
  return {
    status: 'open',
    canRegister: true,
    message: 'Register now'
  }
}
