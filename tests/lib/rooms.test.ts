import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectDB, disconnectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { User } from '@/models/User'
import { Registration } from '@/models/Registration'
import {
  getTodaysRooms,
  registerForRoom,
  cancelRegistration,
  getRoomParticipants,
  updateRoomStatus,
  isRegistrationOpen,
  getRegistrationStatus
} from '@/lib/rooms'
import { addDays, startOfDay, setHours, setMinutes } from 'date-fns'
import mongoose from 'mongoose'

describe('Room Business Logic', () => {
  beforeEach(async () => {
    await connectDB()
    // Clean up database before each test
    await Room.deleteMany({})
    await User.deleteMany({})
    await Registration.deleteMany({})
  })

  afterEach(async () => {
    await Room.deleteMany({})
    await User.deleteMany({})
    await Registration.deleteMany({})
  })

  describe('getTodaysRooms', () => {
    it('should return today\'s 8 rooms', async () => {
      const today = startOfDay(new Date())
      const tomorrow = addDays(today, 1)

      // Create 8 rooms for today (9am-4pm)
      for (let hour = 9; hour <= 16; hour++) {
        await Room.create({
          title: 'Focus Room',
          scheduledTime: setMinutes(setHours(today, hour), 0),
          duration: 45,
          capacity: 12,
          status: 'scheduled'
        })
      }

      // Create a room for tomorrow (should not be included)
      await Room.create({
        title: 'Focus Room',
        scheduledTime: setMinutes(setHours(tomorrow, 9), 0),
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      const rooms = await getTodaysRooms()
      expect(rooms).toHaveLength(8)
    })

    it('should return rooms sorted by scheduled time', async () => {
      const today = startOfDay(new Date())

      // Create rooms in random order
      await Room.create({
        title: 'Focus Room',
        scheduledTime: setMinutes(setHours(today, 14), 0),
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      await Room.create({
        title: 'Focus Room',
        scheduledTime: setMinutes(setHours(today, 9), 0),
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      const rooms = await getTodaysRooms()
      expect(rooms[0].scheduledTime.getHours()).toBe(9)
      expect(rooms[1].scheduledTime.getHours()).toBe(14)
    })
  })

  describe('registerForRoom', () => {
    it('should add participant atomically', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'Asia/Kolkata'
      })

      // Create room 30 minutes in the future (within registration window)
      const futureTime = new Date(Date.now() + 30 * 60 * 1000)
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      const updatedRoom = await registerForRoom(room._id.toString(), user._id.toString())

      expect(updatedRoom.participants).toHaveLength(1)
      expect(updatedRoom.participants[0].toString()).toBe(user._id.toString())
    })

    it('should throw error if room is full', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        name: 'User 1',
        timezone: 'Asia/Kolkata'
      })

      const user2 = await User.create({
        email: 'user2@example.com',
        name: 'User 2',
        timezone: 'Asia/Kolkata'
      })

      // Create room 30 minutes in the future with capacity 1
      const futureTime = new Date(Date.now() + 30 * 60 * 1000)
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: futureTime,
        duration: 45,
        capacity: 1, // Only 1 spot
        status: 'scheduled'
      })

      // First registration should succeed
      await registerForRoom(room._id.toString(), user1._id.toString())

      // Second registration should fail
      await expect(
        registerForRoom(room._id.toString(), user2._id.toString())
      ).rejects.toThrow('Room is full')
    })

    it('should prevent race conditions with parallel registrations', async () => {
      // Create a room 30 minutes in the future with capacity of 2
      const futureTime = new Date(Date.now() + 30 * 60 * 1000)
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: futureTime,
        duration: 45,
        capacity: 2,
        status: 'scheduled'
      })

      // Create 3 users
      const users = await Promise.all([
        User.create({
          email: 'user1@example.com',
          name: 'User 1',
          timezone: 'Asia/Kolkata'
        }),
        User.create({
          email: 'user2@example.com',
          name: 'User 2',
          timezone: 'Asia/Kolkata'
        }),
        User.create({
          email: 'user3@example.com',
          name: 'User 3',
          timezone: 'Asia/Kolkata'
        })
      ])

      // Attempt parallel registrations
      const results = await Promise.allSettled([
        registerForRoom(room._id.toString(), users[0]._id.toString()),
        registerForRoom(room._id.toString(), users[1]._id.toString()),
        registerForRoom(room._id.toString(), users[2]._id.toString())
      ])

      // Only 2 should succeed
      const successful = results.filter(r => r.status === 'fulfilled')
      const failed = results.filter(r => r.status === 'rejected')

      expect(successful).toHaveLength(2)
      expect(failed).toHaveLength(1)

      // Verify room state
      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.participants).toHaveLength(2)
    })

    it('should throw error if registration window not open', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'Asia/Kolkata'
      })

      // Create room 2 hours in the future
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000)
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      await expect(
        registerForRoom(room._id.toString(), user._id.toString())
      ).rejects.toThrow()
    })
  })

  describe('cancelRegistration', () => {
    it('should remove participant atomically', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'Asia/Kolkata'
      })

      const today = startOfDay(new Date())
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: setMinutes(setHours(today, 10), 0),
        duration: 45,
        capacity: 12,
        status: 'scheduled',
        participants: [user._id]
      })

      // Create registration record
      await Registration.create({
        userId: user._id,
        roomId: room._id,
        registeredAt: new Date(),
        status: 'registered'
      })

      const updatedRoom = await cancelRegistration(room._id.toString(), user._id.toString())

      expect(updatedRoom.participants).toHaveLength(0)
    })

    it('should throw error if user not registered', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'Asia/Kolkata'
      })

      const today = startOfDay(new Date())
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: setMinutes(setHours(today, 10), 0),
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      await expect(
        cancelRegistration(room._id.toString(), user._id.toString())
      ).rejects.toThrow('Registration not found')
    })
  })

  describe('updateRoomStatus', () => {
    it('should update room status', async () => {
      const today = startOfDay(new Date())
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: setMinutes(setHours(today, 10), 0),
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      const updatedRoom = await updateRoomStatus(room._id.toString(), 'open')

      expect(updatedRoom.status).toBe('open')
    })

    it('should throw error for invalid status', async () => {
      const today = startOfDay(new Date())
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: setMinutes(setHours(today, 10), 0),
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      await expect(
        updateRoomStatus(room._id.toString(), 'invalid' as any)
      ).rejects.toThrow('Invalid status')
    })
  })

  describe('getRoomParticipants', () => {
    it('should return populated user data', async () => {
      const user1 = await User.create({
        email: 'user1@example.com',
        name: 'User 1',
        timezone: 'Asia/Kolkata'
      })

      const user2 = await User.create({
        email: 'user2@example.com',
        name: 'User 2',
        timezone: 'Asia/Kolkata'
      })

      const today = startOfDay(new Date())
      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime: setMinutes(setHours(today, 10), 0),
        duration: 45,
        capacity: 12,
        status: 'scheduled',
        participants: [user1._id, user2._id]
      })

      const participants = await getRoomParticipants(room._id.toString())

      expect(participants).toHaveLength(2)
      expect(participants[0].email).toBe('user1@example.com')
      expect(participants[1].email).toBe('user2@example.com')
    })
  })

  describe('isRegistrationOpen', () => {
    it('should return false before 30-minute window', () => {
      const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours ahead
      const room = {
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        participants: [],
        status: 'scheduled'
      } as any

      expect(isRegistrationOpen(room)).toBe(false)
    })

    it('should return true within 30-minute window', () => {
      const futureTime = new Date(Date.now() + 20 * 60 * 1000) // 20 minutes ahead
      const room = {
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        participants: [],
        status: 'scheduled'
      } as any

      expect(isRegistrationOpen(room)).toBe(true)
    })
  })

  describe('getRegistrationStatus', () => {
    it('should return "closed" for ended session', () => {
      const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
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
    })

    it('should return "full" for full room', () => {
      const user = new mongoose.Types.ObjectId()
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
    })

    it('should return "open" when registration is available', () => {
      const futureTime = new Date(Date.now() + 20 * 60 * 1000)

      const room = {
        scheduledTime: futureTime,
        duration: 45,
        capacity: 12,
        participants: [],
        status: 'open'
      } as any

      const status = getRegistrationStatus(room)

      expect(status.status).toBe('open')
      expect(status.canRegister).toBe(true)
    })
  })
})
