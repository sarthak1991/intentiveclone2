import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { Registration } from '@/models/Registration'
import { Room } from '@/models/Room'
import { User } from '@/models/User'

describe('Registration Model', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Registration.deleteMany({})
    await Room.deleteMany({})
    await User.deleteMany({})
  })

  it('should create registration', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const room = await Room.create({
      scheduledTime: new Date('2026-04-07T09:00:00Z')
    })

    const registration = await Registration.create({
      userId: user._id,
      roomId: room._id
    })

    expect(registration.userId).toEqual(user._id)
    expect(registration.roomId).toEqual(room._id)
    expect(registration.status).toBe('registered')
    expect(registration.registeredAt).toBeInstanceOf(Date)
  })

  it('should enforce unique userId + roomId', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const room = await Room.create({
      scheduledTime: new Date('2026-04-07T09:00:00Z')
    })

    await Registration.create({
      userId: user._id,
      roomId: room._id
    })

    // Try to create duplicate registration
    await expect(Registration.create({
      userId: user._id,
      roomId: room._id
    })).rejects.toThrow()
  })

  it('should validate status enum', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const room1 = await Room.create({
      scheduledTime: new Date('2026-04-07T09:00:00Z')
    })

    const room2 = await Room.create({
      scheduledTime: new Date('2026-04-07T10:00:00Z')
    })

    const room3 = await Room.create({
      scheduledTime: new Date('2026-04-07T11:00:00Z')
    })

    const room4 = await Room.create({
      scheduledTime: new Date('2026-04-07T12:00:00Z')
    })

    // Create rooms with different statuses
    await Registration.create({
      userId: user._id,
      roomId: room1._id,
      status: 'registered'
    })

    await Registration.create({
      userId: user._id,
      roomId: room2._id,
      status: 'cancelled'
    })

    await Registration.create({
      userId: user._id,
      roomId: room3._id,
      status: 'no-show'
    })

    await Registration.create({
      userId: user._id,
      roomId: room4._id,
      status: 'attended'
    })

    // Test invalid status with a new room
    const room5 = await Room.create({
      scheduledTime: new Date('2026-04-07T13:00:00Z')
    })

    await expect(Registration.create({
      userId: user._id,
      roomId: room5._id,
      status: 'invalid' as any
    })).rejects.toThrow()
  })

  it('should update status to attended', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const room = await Room.create({
      scheduledTime: new Date('2026-04-07T09:00:00Z')
    })

    const registration = await Registration.create({
      userId: user._id,
      roomId: room._id
    })

    registration.status = 'attended'
    registration.attendedAt = new Date()
    await registration.save()

    const updated = await Registration.findById(registration._id)
    expect(updated?.status).toBe('attended')
    expect(updated?.attendedAt).toBeInstanceOf(Date)
  })

  it('should populate userId and roomId', async () => {
    const user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const room = await Room.create({
      scheduledTime: new Date('2026-04-07T09:00:00Z')
    })

    const registration = await Registration.create({
      userId: user._id,
      roomId: room._id
    })

    const populated = await Registration.findById(registration._id)
      .populate('userId')
      .populate('roomId')

    expect(populated?.userId).toBeDefined()
    expect(populated?.roomId).toBeDefined()
    // @ts-ignore - populated fields have different types
    expect(populated?.userId.email).toBe('test@example.com')
    // @ts-ignore - populated fields have different types
    expect(populated?.roomId.title).toBe('Focus Room')
  })
})
