import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectDB, disconnectDB } from '@/lib/db'
import { User } from '@/models/User'
import {
  formatRoomTime,
  formatRoomDateTime,
  getUserTimezoneById,
  convertUTCToUserTimezone,
  isRegistrationOpen,
  getRegistrationStatus
} from '@/lib/timezone'
import mongoose from 'mongoose'

describe('Timezone Utilities', () => {
  beforeEach(async () => {
    await connectDB()
  })

  afterEach(async () => {
    await User.deleteMany({})
  })

  describe('formatRoomTime', () => {
    it('should convert UTC to IST', () => {
      // Create a UTC time (9:00 AM UTC)
      const utcTime = new Date('2026-04-06T09:00:00Z')

      // Format for IST (UTC+5:30) -> 2:30 PM IST
      const istTime = formatRoomTime(utcTime, 'Asia/Kolkata')

      expect(istTime).toMatch(/2:30 PM|2:30 pm/)
    })

    it('should convert UTC to EST', () => {
      // Create a UTC time (9:00 AM UTC)
      const utcTime = new Date('2026-04-06T09:00:00Z')

      // Format for EST (UTC-5) -> 5:00 AM EDT (daylight saving time)
      const estTime = formatRoomTime(utcTime, 'America/New_York')

      expect(estTime).toMatch(/5:00 AM|5:00 am/)
    })

    it('should handle invalid timezone gracefully', () => {
      const utcTime = new Date('2026-04-06T09:00:00Z')

      // Invalid timezone should fallback to UTC
      const time = formatRoomTime(utcTime, 'Invalid/Timezone')

      expect(time).toBeTruthy()
      // Should either show the time in UTC or the original time
      expect(time).toMatch(/\d{1,2}:\d{2}\s?[AP]M/i)
    })
  })

  describe('formatRoomDateTime', () => {
    it('should format date and time in user timezone', () => {
      const utcTime = new Date('2026-04-06T09:00:00Z')

      const formatted = formatRoomDateTime(utcTime, 'Asia/Kolkata')

      expect(formatted).toContain('Apr')
      expect(formatted).toContain('2026')
      expect(formatted).toMatch(/2:30 PM|2:30 pm/)
    })

    it('should handle invalid timezone gracefully', () => {
      const utcTime = new Date('2026-04-06T09:00:00Z')

      const formatted = formatRoomDateTime(utcTime, 'Invalid/Timezone')

      expect(formatted).toBeTruthy()
      expect(formatted).toContain('Apr')
    })
  })

  describe('getUserTimezoneById', () => {
    it('should return user timezone from database', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'Asia/Kolkata',
        isOnboarded: false
      })

      const timezone = await getUserTimezoneById(user._id)

      expect(timezone).toBe('Asia/Kolkata')
    })

    it('should return UTC fallback if user not found', async () => {
      const fakeId = new mongoose.Types.ObjectId()

      const timezone = await getUserTimezoneById(fakeId)

      expect(timezone).toBe('UTC')
    })

    it('should return UTC fallback if user has no timezone', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        timezone: '',
        isOnboarded: false
      })

      const timezone = await getUserTimezoneById(user._id)

      expect(timezone).toBe('UTC')
    })
  })

  describe('convertUTCToUserTimezone', () => {
    it('should convert UTC date to user timezone', () => {
      const utcDate = new Date('2026-04-06T09:00:00Z')

      const userDate = convertUTCToUserTimezone(utcDate, 'Asia/Kolkata')

      // Should be 2:30 PM in IST
      expect(userDate.getHours()).toBe(14)
      expect(userDate.getMinutes()).toBe(30)
    })

    it('should handle invalid timezone gracefully', () => {
      const utcDate = new Date('2026-04-06T09:00:00Z')

      // Should return original date if timezone is invalid
      const userDate = convertUTCToUserTimezone(utcDate, 'Invalid/Timezone')

      expect(userDate).toBeInstanceOf(Date)
    })
  })

  describe('isRegistrationOpen', () => {
    it('should return false before 30-minute window', () => {
      // Room scheduled 2 hours from now
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000)

      const room = {
        scheduledTime: futureTime,
        duration: 45
      } as any

      expect(isRegistrationOpen(room)).toBe(false)
    })

    it('should return true within 30-minute window', () => {
      // Room scheduled 20 minutes from now
      const futureTime = new Date(Date.now() + 20 * 60 * 1000)

      const room = {
        scheduledTime: futureTime,
        duration: 45
      } as any

      expect(isRegistrationOpen(room)).toBe(true)
    })

    it('should return true when session started', () => {
      // Room started 10 minutes ago
      const pastTime = new Date(Date.now() - 10 * 60 * 1000)

      const room = {
        scheduledTime: pastTime,
        duration: 45
      } as any

      expect(isRegistrationOpen(room)).toBe(true)
    })
  })

  describe('getRegistrationStatus', () => {
    it('should return "closed" for ended session', () => {
      // Session ended 1 hour ago
      const pastTime = new Date(Date.now() - 60 * 60 * 1000)

      const room = {
        scheduledTime: pastTime,
        duration: 45,
        capacity: 12,
        participants: [],
        status: 'completed'
      } as any

      const status = getRegistrationStatus(room)

      expect(status.status).toBe('closed')
      expect(status.canRegister).toBe(false)
      expect(status.message).toBe('This session has ended')
    })

    it('should return "in-progress" for active session', () => {
      // Session started 10 minutes ago
      const startTime = new Date(Date.now() - 10 * 60 * 1000)

      const room = {
        scheduledTime: startTime,
        duration: 45,
        capacity: 12,
        participants: [],
        status: 'in-progress'
      } as any

      const status = getRegistrationStatus(room)

      expect(status.status).toBe('in-progress')
      expect(status.canRegister).toBe(false)
      expect(status.message).toBe('This session is currently in progress')
    })

    it('should return "full" for full room', () => {
      // Room scheduled for 20 minutes from now
      const futureTime = new Date(Date.now() + 20 * 60 * 1000)
      const participants = Array(12).fill(null).map(() => new mongoose.Types.ObjectId())

      const room = {
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        participants,
        status: 'open'
      } as any

      const status = getRegistrationStatus(room)

      expect(status.status).toBe('full')
      expect(status.canRegister).toBe(false)
      expect(status.message).toBe('This room is full')
    })

    it('should return "registered" for already registered user', () => {
      const userId = new mongoose.Types.ObjectId()
      const futureTime = new Date(Date.now() + 20 * 60 * 1000)

      const room = {
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        participants: [userId],
        status: 'open'
      } as any

      const user = {
        _id: userId,
        timezone: 'Asia/Kolkata'
      } as any

      const status = getRegistrationStatus(room, user)

      expect(status.status).toBe('registered')
      expect(status.canRegister).toBe(false)
      expect(status.message).toBe('You are registered for this session')
    })

    it('should return "upcoming" before registration window', () => {
      // Room scheduled 2 hours from now
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000)

      const room = {
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        participants: [],
        status: 'scheduled'
      } as any

      const user = {
        timezone: 'Asia/Kolkata'
      } as any

      const status = getRegistrationStatus(room, user)

      expect(status.status).toBe('upcoming')
      expect(status.canRegister).toBe(false)
      expect(status.message).toContain('Registration opens')
    })

    it('should return "open" when registration is available', () => {
      // Room scheduled 20 minutes from now
      const futureTime = new Date(Date.now() + 20 * 60 * 1000)

      const room = {
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        participants: [],
        status: 'scheduled'
      } as any

      const status = getRegistrationStatus(room)

      expect(status.status).toBe('open')
      expect(status.canRegister).toBe(true)
      expect(status.message).toBe('Register now')
    })
  })
})
