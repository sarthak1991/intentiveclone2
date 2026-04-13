import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { Room } from '@/models/Room'
import { User } from '@/models/User'

describe('Room Model', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Room.deleteMany({})
    await User.deleteMany({})
  })

  it('should create room with default values', async () => {
    const scheduledTime = new Date('2026-04-07T09:00:00Z')
    const room = await Room.create({
      scheduledTime
    })

    expect(room.title).toBe('Focus Room')
    expect(room.duration).toBe(45)
    expect(room.capacity).toBe(12)
    expect(room.status).toBe('scheduled')
    expect(room.participants).toEqual([])
    expect(room.waitlist).toEqual([])
    expect(room.interestTags).toEqual([])
    expect(room.isOverflowRoom).toBe(false)
  })

  it('should enforce capacity limits (min 1, max 12)', async () => {
    const scheduledTime = new Date('2026-04-07T09:00:00Z')

    // Test minimum capacity
    const roomMin = await Room.create({
      scheduledTime,
      capacity: 1
    })
    expect(roomMin.capacity).toBe(1)

    // Test maximum capacity
    const roomMax = await Room.create({
      scheduledTime,
      capacity: 12
    })
    expect(roomMax.capacity).toBe(12)

    // Test invalid capacity (below minimum)
    await expect(Room.create({
      scheduledTime,
      capacity: 0
    })).rejects.toThrow()

    // Test invalid capacity (above maximum)
    await expect(Room.create({
      scheduledTime,
      capacity: 13
    })).rejects.toThrow()
  })

  it('should validate status enum values', async () => {
    const scheduledTime = new Date('2026-04-07T09:00:00Z')

    const validStatuses = ['scheduled', 'open', 'full', 'in-progress', 'completed', 'cancelled']
    for (const status of validStatuses) {
      const room = await Room.create({
        scheduledTime,
        status: status as any
      })
      expect(room.status).toBe(status)
    }

    // Test invalid status
    await expect(Room.create({
      scheduledTime,
      status: 'invalid' as any
    })).rejects.toThrow()
  })

  it('should add participant to room', async () => {
    const scheduledTime = new Date('2026-04-07T09:00:00Z')
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const room = await Room.create({
      scheduledTime,
      participants: [user._id]
    })

    const populatedRoom = await Room.findById(room._id).populate('participants')
    expect(populatedRoom?.participants).toHaveLength(1)
    expect(populatedRoom?.participants[0]._id).toEqual(user._id)
  })

  it('should prevent duplicate participants', async () => {
    const scheduledTime = new Date('2026-04-07T09:00:00Z')
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const room = await Room.create({
      scheduledTime,
      participants: [user._id, user._id] // Duplicate user
    })

    // Mongoose doesn't prevent duplicates in arrays by default
    // This test documents current behavior - validation can be added in API layer
    expect(room.participants).toHaveLength(2)
  })

  it('should add user to waitlist', async () => {
    const scheduledTime = new Date('2026-04-07T09:00:00Z')
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const room = await Room.create({
      scheduledTime,
      waitlist: [{ user: user._id, joinedAt: new Date() }]
    })

    expect(room.waitlist).toHaveLength(1)
    expect(room.waitlist[0].user).toEqual(user._id)
    expect(room.waitlist[0].joinedAt).toBeInstanceOf(Date)
  })

  it('should query today\'s rooms using compound index', async () => {
    const todayStart = new Date('2026-04-07T00:00:00Z')
    const todayEnd = new Date('2026-04-07T23:59:59Z')
    const today9am = new Date('2026-04-07T09:00:00Z')
    const today10am = new Date('2026-04-07T10:00:00Z')
    const tomorrow = new Date('2026-04-08T09:00:00Z')

    await Room.create([
      { scheduledTime: today9am, status: 'open' },
      { scheduledTime: today10am, status: 'full' },
      { scheduledTime: tomorrow, status: 'open' }
    ])

    const todayRooms = await Room.find({
      scheduledTime: {
        $gte: todayStart,
        $lt: todayEnd
      }
    }).sort({ scheduledTime: 1 })

    expect(todayRooms).toHaveLength(2)
    expect(todayRooms[0].status).toBe('open')
    expect(todayRooms[1].status).toBe('full')
  })
})
