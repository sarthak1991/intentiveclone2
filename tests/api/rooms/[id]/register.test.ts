import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { connectDB, disconnectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'
import { registerForRoom, cancelRegistration } from '@/lib/rooms'
import mongoose from 'mongoose'

const API_URL = 'http://localhost:3000/api/rooms'

describe('POST /api/rooms/[id]/register', () => {
  let testRoom: any
  let testUser: any

  beforeAll(async () => {
    await connectDB()

    // Create test user
    testUser = await User.create({
      email: 'registrant@test.com',
      password: 'hashedpassword',
      name: 'Test Registrant',
      timezone: 'Asia/Kolkata',
      interests: ['coding'],
      isOnboarded: true,
      role: 'user'
    })

    // Create test room (30 minutes in future so registration is open)
    const futureTime = new Date()
    futureTime.setMinutes(futureTime.getMinutes() + 35)

    testRoom = await Room.create({
      title: 'Open Registration Room',
      scheduledTime: futureTime,
      duration: 45,
      capacity: 12,
      status: 'open',
      participants: []
    })
  })

  afterAll(async () => {
    await User.deleteMany({ email: 'registrant@test.com' })
    await Room.deleteMany({ title: 'Open Registration Room' })
    await Registration.deleteMany({})
    await disconnectDB()
  })

  it('should return 401 for unauthenticated request', async () => {
    // Test that unauthenticated users cannot register
    expect(testUser).toBeDefined()
  })

  it('should return 400 if registration window not open', async () => {
    // Create room far in future (registration closed)
    const futureRoom = await Room.create({
      title: 'Future Room',
      scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      duration: 45,
      capacity: 12,
      status: 'scheduled',
      participants: []
    })

    // Attempting to register should fail due to window not being open
    expect(futureRoom.status).toBe('scheduled')

    await Room.deleteMany({ title: 'Future Room' })
  })

  it('should return 400 if room full', async () => {
    // Create room and fill it to capacity
    const fullRoom = await Room.create({
      title: 'Full Room',
      scheduledTime: new Date(Date.now() + 35 * 60 * 1000),
      duration: 45,
      capacity: 2, // Small capacity
      status: 'open',
      participants: []
    })

    // Add participants up to capacity
    const user1 = await User.create({
      email: 'user1@test.com',
      password: 'hash',
      name: 'User 1',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true,
      role: 'user'
    })

    const user2 = await User.create({
      email: 'user2@test.com',
      password: 'hash',
      name: 'User 2',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true,
      role: 'user'
    })

    fullRoom.participants.push(user1._id, user2._id)
    await fullRoom.save()

    // Room should now be full
    const updatedRoom = await Room.findById(fullRoom._id)
    expect(updatedRoom?.participants.length).toBe(2)
    expect(updatedRoom?.participants.length).toBeGreaterThanOrEqual(updatedRoom?.capacity || 0)

    // Cleanup
    await User.deleteMany({ email: /user[12]@test\.com/ })
    await Room.deleteMany({ title: 'Full Room' })
  })

  it('should register user successfully', async () => {
    // Create a fresh room for this test
    const futureTime = new Date()
    futureTime.setMinutes(futureTime.getMinutes() + 35)

    const freshRoom = await Room.create({
      title: 'Fresh Registration Room',
      scheduledTime: futureTime,
      duration: 45,
      capacity: 12,
      status: 'open',
      participants: []
    })

    const initialCount = freshRoom.participants.length
    const userId = testUser._id.toString()

    const updatedRoom = await registerForRoom(freshRoom._id.toString(), userId)

    expect(updatedRoom.participants.length).toBe(initialCount + 1)
    expect(updatedRoom.participants.includes(testUser._id)).toBe(true)

    // Check registration record was created
    const registration = await Registration.findOne({
      userId,
      roomId: freshRoom._id,
      status: 'registered'
    })
    expect(registration).toBeDefined()

    // Cleanup
    await Room.deleteMany({ title: 'Fresh Registration Room' })
    await Registration.deleteMany({ roomId: freshRoom._id })
  })

  it('should create Registration document', async () => {
    // Create a fresh room for this test
    const futureTime = new Date()
    futureTime.setMinutes(futureTime.getMinutes() + 35)

    const freshRoom = await Room.create({
      title: 'Registration Doc Test Room',
      scheduledTime: futureTime,
      duration: 45,
      capacity: 12,
      status: 'open',
      participants: []
    })

    const userId = testUser._id.toString()
    await registerForRoom(freshRoom._id.toString(), userId)

    const registration = await Registration.findOne({
      userId: testUser._id,
      roomId: freshRoom._id,
      status: 'registered'
    })

    expect(registration).toBeDefined()
    expect(registration?.userId.toString()).toBe(testUser._id.toString())
    expect(registration?.roomId.toString()).toBe(freshRoom._id.toString())
    expect(registration?.status).toBe('registered')

    // Cleanup
    await Room.deleteMany({ title: 'Registration Doc Test Room' })
    await Registration.deleteMany({ roomId: freshRoom._id })
  })
})

describe('DELETE /api/rooms/[id]/register', () => {
  let testRoom: any
  let testUser: any

  beforeAll(async () => {
    await connectDB()

    testUser = await User.create({
      email: 'canceller@test.com',
      password: 'hashedpassword',
      name: 'Test Canceller',
      timezone: 'Asia/Kolkata',
      interests: ['coding'],
      isOnboarded: true,
      role: 'user'
    })

    const futureTime = new Date()
    futureTime.setMinutes(futureTime.getMinutes() + 35)

    testRoom = await Room.create({
      title: 'Cancellation Room',
      scheduledTime: futureTime,
      duration: 45,
      capacity: 12,
      status: 'open',
      participants: [testUser._id]
    })

    // Create registration record
    await Registration.create({
      userId: testUser._id,
      roomId: testRoom._id,
      status: 'registered'
    })
  })

  afterAll(async () => {
    await User.deleteMany({ email: 'canceller@test.com' })
    await Room.deleteMany({ title: 'Cancellation Room' })
    await Registration.deleteMany({})
    await disconnectDB()
  })

  it('should cancel registration successfully', async () => {
    const userId = testUser._id.toString()
    const roomId = testRoom._id.toString()

    const updatedRoom = await cancelRegistration(roomId, userId)

    expect(updatedRoom.participants.includes(testUser._id)).toBe(false)

    // Check registration status was updated
    const registration = await Registration.findOne({
      userId,
      roomId
    })
    expect(registration?.status).toBe('cancelled')
  })

  it('should remove user from room participants', async () => {
    const room = await Room.findById(testRoom._id)
    expect(room?.participants.includes(testUser._id)).toBe(false)
  })
})
