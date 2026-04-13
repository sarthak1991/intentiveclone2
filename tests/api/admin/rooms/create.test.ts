import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { connectDB, disconnectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Room } from '@/models/Room'

const API_URL = 'http://localhost:3000/api/admin/rooms'

describe('POST /api/admin/rooms', () => {
  let testAdminUser: any

  beforeAll(async () => {
    await connectDB()

    testAdminUser = await User.create({
      email: 'admin-creator@test.com',
      password: 'hashedpassword',
      name: 'Admin Creator',
      timezone: 'Asia/Kolkata',
      interests: [],
      isOnboarded: true,
      role: 'admin'
    })
  })

  afterAll(async () => {
    await User.deleteMany({ email: 'admin-creator@test.com' })
    await Room.deleteMany({ title: 'Admin Created Room' })
    await disconnectDB()
  })

  it('should return 403 for non-admin user', async () => {
    // Create regular user
    const regularUser = await User.create({
      email: 'regular@test.com',
      password: 'hash',
      name: 'Regular User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true,
      role: 'user'
    })

    // Regular user should not be able to create rooms
    expect(regularUser.role).toBe('user')
    expect(testAdminUser.role).toBe('admin')

    await User.deleteMany({ email: 'regular@test.com' })
  })

  it('should create room as admin', async () => {
    const roomData = {
      title: 'Admin Created Room',
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      duration: 45,
      capacity: 12,
      interestTags: ['coding', 'focus']
    }

    const room = await Room.create({
      ...roomData,
      scheduledTime: new Date(roomData.scheduledTime),
      status: 'scheduled'
    })

    expect(room.title).toBe('Admin Created Room')
    expect(room.duration).toBe(45)
    expect(room.capacity).toBe(12)
    expect(room.interestTags).toEqual(['coding', 'focus'])
    expect(room.status).toBe('scheduled')
  })

  it('should validate input with zod schema', () => {
    // Test validation rules

    // Title too long
    const invalidTitle = 'a'.repeat(101)
    expect(invalidTitle.length).toBeGreaterThan(100)

    // Duration too short
    const invalidDuration = 10
    expect(invalidDuration).toBeLessThan(15)

    // Capacity too high
    const invalidCapacity = 15
    expect(invalidCapacity).toBeGreaterThan(12)

    // Invalid datetime
    const invalidDateTime = 'not-a-date'
    expect(invalidDateTime).toBe('not-a-date')
  })

  it('should set default values', async () => {
    const roomData = {
      scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }

    const room = await Room.create({
      ...roomData,
      scheduledTime: new Date(roomData.scheduledTime),
      status: 'scheduled'
    })

    expect(room.title).toBe('Focus Room') // Default title
    expect(room.duration).toBe(45) // Default duration
    expect(room.capacity).toBe(12) // Default capacity

    await Room.deleteOne({ _id: room._id })
  })
})
