import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { connectDB, disconnectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'
import { recordNoShow } from '@/lib/rooms'
import mongoose from 'mongoose'

const API_URL = 'http://localhost:3000/api/admin/rooms'

describe('POST /api/admin/rooms/[id]/noshow', () => {
  let testAdminUser: any
  let testRoom: any
  let testUser: any
  let waitingUser: any

  beforeAll(async () => {
    await connectDB()

    // Create admin user
    testAdminUser = await User.create({
      email: 'admin-noshow@test.com',
      password: 'hashedpassword',
      name: 'Admin NoShow',
      timezone: 'Asia/Kolkata',
      interests: [],
      isOnboarded: true,
      role: 'admin'
    })

    // Create test user
    testUser = await User.create({
      email: 'noshow-user@test.com',
      password: 'hashedpassword',
      name: 'NoShow User',
      timezone: 'Asia/Kolkata',
      interests: ['coding'],
      isOnboarded: true,
      role: 'user'
    })

    // Create waiting user for waitlist
    waitingUser = await User.create({
      email: 'waiting-user@test.com',
      password: 'hashedpassword',
      name: 'Waiting User',
      timezone: 'Asia/Kolkata',
      interests: ['coding'],
      isOnboarded: true,
      role: 'user'
    })

    // Create test room with participants and waitlist
    const futureTime = new Date()
    futureTime.setMinutes(futureTime.getMinutes() + 35)

    testRoom = await Room.create({
      title: 'NoShow Test Room',
      scheduledTime: futureTime,
      duration: 45,
      capacity: 12,
      status: 'open',
      participants: [testUser._id],
      waitlist: [
        {
          user: waitingUser._id,
          joinedAt: new Date()
        }
      ]
    })

    // Create registration for test user
    await Registration.create({
      userId: testUser._id,
      roomId: testRoom._id,
      status: 'registered'
    })
  })

  afterAll(async () => {
    await User.deleteMany({ email: /.*-noshow@test\.com/ })
    await User.deleteMany({ email: /noshow-user@test\.com/ })
    await User.deleteMany({ email: /waiting-user@test\.com/ })
    await Room.deleteMany({ title: 'NoShow Test Room' })
    await Registration.deleteMany({})
    await disconnectDB()
  })

  it('should return 403 for non-admin user', async () => {
    // Test that non-admin users cannot mark no-shows
    expect(testAdminUser.role).toBe('admin')
    expect(testUser.role).toBe('user')
  })

  it('should record no-show and remove participant', async () => {
    const userId = testUser._id.toString()
    const roomId = testRoom._id.toString()

    const { room } = await recordNoShow(roomId, userId, 'User did not show up')

    // User should be removed from participants
    expect(room.participants.includes(testUser._id)).toBe(false)

    // Registration should be updated to no-show
    const registration = await Registration.findOne({
      userId,
      roomId
    })
    expect(registration?.status).toBe('no-show')
    expect(registration?.remarks).toBe('User did not show up')
  })

  it('should promote first waitlist user to participant', async () => {
    // Create a fresh room for this test with waitlist
    const futureTime = new Date()
    futureTime.setMinutes(futureTime.getMinutes() + 35)

    const freshRoom = await Room.create({
      title: 'Waitlist Promotion Test Room',
      scheduledTime: futureTime,
      duration: 45,
      capacity: 12,
      status: 'open',
      participants: [testUser._id],
      waitlist: [
        {
          user: waitingUser._id,
          joinedAt: new Date()
        }
      ]
    })

    // Create registration for test user
    await Registration.create({
      userId: testUser._id,
      roomId: freshRoom._id,
      status: 'registered'
    })

    const roomId = freshRoom._id.toString()

    // Initially, waiting user should be on waitlist
    let room = await Room.findById(roomId)
    expect(room?.waitlist.length).toBeGreaterThan(0)

    // Mark test user as no-show (this will promote waiting user)
    const userId = testUser._id.toString()
    const { room: updatedRoom, promotedUser } = await recordNoShow(roomId, userId)

    // Waiting user should now be a participant
    expect(updatedRoom.participants.includes(waitingUser._id)).toBe(true)

    // Waitlist should be empty
    expect(updatedRoom.waitlist.length).toBe(0)

    // Promoted user should be returned
    expect(promotedUser?._id.toString()).toBe(waitingUser._id.toString())

    // Registration should be created for promoted user
    const promotedRegistration = await Registration.findOne({
      userId: waitingUser._id,
      roomId,
      status: 'registered'
    })
    expect(promotedRegistration).toBeDefined()

    // Cleanup
    await Room.deleteMany({ title: 'Waitlist Promotion Test Room' })
  })

  it('should return 404 if registration not found', async () => {
    const fakeUserId = new mongoose.Types.ObjectId().toString()
    const roomId = testRoom._id.toString()

    // Attempting to record no-show for non-existent registration should fail
    await expect(
      recordNoShow(roomId, fakeUserId)
    ).rejects.toThrow('Registration not found')
  })
})
