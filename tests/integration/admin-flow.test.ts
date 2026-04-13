import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'
import { InterestTag } from '@/models/InterestTag'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

describe('Integration: Admin Room Management', () => {
  let adminUser: any
  let regularUser: any
  let adminAuthCookie: string
  let userAuthCookie: string

  beforeAll(async () => {
    await connectDB()

    // Create test users
    const hashedPassword = await bcrypt.hash('Password123', 10)

    adminUser = await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      isOnboarded: true,
      role: 'admin',
      timezone: 'Asia/Kolkata'
    })

    regularUser = await User.create({
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Regular User',
      isOnboarded: true,
      timezone: 'Asia/Kolkata'
    })

    // Login as admin
    const adminLoginRes = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'Password123'
      })
    })

    if (adminLoginRes.ok) {
      adminAuthCookie = adminLoginRes.headers.get('set-cookie') || ''
    }

    // Login as regular user
    const userLoginRes = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'user@example.com',
        password: 'Password123'
      })
    })

    if (userLoginRes.ok) {
      userAuthCookie = userLoginRes.headers.get('set-cookie') || ''
    }
  })

  afterAll(async () => {
    await User.deleteMany({})
    await Room.deleteMany({})
    await Registration.deleteMany({})
    await InterestTag.deleteMany({})
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    // Clean up before each test
    await Room.deleteMany({})
    await Registration.deleteMany({})
    await InterestTag.deleteMany({})
  })

  describe('Admin creates room', () => {
    it('should create room with valid data', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)

      const roomData = {
        title: 'Focus Room',
        scheduledTime: scheduledTime.toISOString(),
        duration: 45,
        capacity: 12,
        interestTags: ['coding', 'productivity']
      }

      const response = await fetch('http://localhost:3000/api/admin/rooms', {
        method: 'POST',
        headers: {
          'Cookie': adminAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      })

      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data.room).toBeDefined()
      expect(data.room.title).toBe('Focus Room')
      expect(data.room.capacity).toBe(12)
      expect(data.room.interestTags).toContain('coding')

      // Verify room saved to database
      const room = await Room.findById(data.room._id)
      expect(room).toBeDefined()
      expect(room?.status).toBe('scheduled')
    })

    it('should validate required fields', async () => {
      const response = await fetch('http://localhost:3000/api/admin/rooms', {
        method: 'POST',
        headers: {
          'Cookie': adminAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Focus Room'
          // Missing scheduledTime
        })
      })

      expect(response.status).toBe(400)
      const data = await response.json()

      expect(data.error).toBeDefined()
    })
  })

  describe('Non-admin cannot create room', () => {
    it('should return 403 for regular user', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)

      const roomData = {
        title: 'Unauthorized Room',
        scheduledTime: scheduledTime.toISOString(),
        duration: 45,
        capacity: 12
      }

      const response = await fetch('http://localhost:3000/api/admin/rooms', {
        method: 'POST',
        headers: {
          'Cookie': userAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      })

      expect(response.status).toBe(403)

      // Verify room NOT created
      const rooms = await Room.find({ title: 'Unauthorized Room' })
      expect(rooms.length).toBe(0)
    })

    it('should return 401 for unauthenticated user', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)

      const roomData = {
        title: 'Unauthorized Room',
        scheduledTime: scheduledTime.toISOString(),
        duration: 45,
        capacity: 12
      }

      const response = await fetch('http://localhost:3000/api/admin/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(roomData)
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Admin updates room', () => {
    it('should update room details', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)

      const room = await Room.create({
        title: 'Original Title',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      const updateData = {
        title: 'Updated Title',
        capacity: 10
      }

      const response = await fetch(`http://localhost:3000/api/rooms/${room._id}`, {
        method: 'PATCH',
        headers: {
          'Cookie': adminAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.room.title).toBe('Updated Title')
      expect(data.room.capacity).toBe(10)

      // Verify changes saved to database
      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.title).toBe('Updated Title')
      expect(updatedRoom?.capacity).toBe(10)
    })

    it('should not allow regular user to update room', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0)

      const room = await Room.create({
        title: 'Original Title',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      const response = await fetch(`http://localhost:3000/api/rooms/${room._id}`, {
        method: 'PATCH',
        headers: {
          'Cookie': userAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Hacked Title'
        })
      })

      expect(response.status).toBe(403)

      // Verify room NOT updated
      const unchangedRoom = await Room.findById(room._id)
      expect(unchangedRoom?.title).toBe('Original Title')
    })
  })

  describe('Admin cancels room', () => {
    it('should cancel room and all registrations', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour from now

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'open',
        participants: [regularUser._id]
      })

      await Registration.create({
        userId: regularUser._id,
        roomId: room._id,
        status: 'registered'
      })

      const response = await fetch(`http://localhost:3000/api/rooms/${room._id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': adminAuthCookie
        }
      })

      expect(response.status).toBe(200)

      // Verify room status cancelled
      const cancelledRoom = await Room.findById(room._id)
      expect(cancelledRoom?.status).toBe('cancelled')

      // Verify all registrations cancelled
      const registration = await Registration.findOne({
        userId: regularUser._id,
        roomId: room._id
      })
      expect(registration?.status).toBe('cancelled')
    })

    it('should remove participants from cancelled room', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 60 * 60 * 1000)

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'open',
        participants: [regularUser._id]
      })

      await fetch(`http://localhost:3000/api/rooms/${room._id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': adminAuthCookie
        }
      })

      const cancelledRoom = await Room.findById(room._id)
      expect(cancelledRoom?.participants).toEqual([])
    })
  })

  describe('Admin manages no-show', () => {
    it('should mark user as no-show and promote from waitlist', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 60 * 60 * 1000)

      // Create waitlist user
      const waitlistUser = await User.create({
        email: 'waitlist@example.com',
        password: bcrypt.hashSync('Password123', 10),
        name: 'Waitlist User',
        isOnboarded: true
      })

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'in-progress',
        participants: [regularUser._id],
        waitlist: [{
          user: waitlistUser._id,
          joinedAt: new Date()
        }]
      })

      await Registration.create({
        userId: regularUser._id,
        roomId: room._id,
        status: 'registered'
      })

      const noshowData = {
        userId: regularUser._id.toString(),
        remarks: 'Did not join within 10 minutes'
      }

      const response = await fetch(`http://localhost:3000/api/admin/rooms/${room._id}/noshow`, {
        method: 'POST',
        headers: {
          'Cookie': adminAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(noshowData)
      })

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data.room).toBeDefined()

      // Verify no-show user removed from participants
      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.participants).not.toContainEqual(regularUser._id)

      // Verify waitlist user promoted to participant
      expect(updatedRoom?.participants).toContainEqual(waitlistUser._id)

      // Verify waitlist cleared for promoted user
      expect(updatedRoom?.waitlist.length).toBe(0)

      // Verify registration status updated
      const registration = await Registration.findOne({
        userId: regularUser._id,
        roomId: room._id
      })
      expect(registration?.status).toBe('no-show')
      expect(registration?.remarks).toBe('Did not join within 10 minutes')
    })

    it('should handle no-show when waitlist is empty', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 60 * 60 * 1000)

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'in-progress',
        participants: [regularUser._id]
      })

      await Registration.create({
        userId: regularUser._id,
        roomId: room._id,
        status: 'registered'
      })

      const response = await fetch(`http://localhost:3000/api/admin/rooms/${room._id}/noshow`, {
        method: 'POST',
        headers: {
          'Cookie': adminAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: regularUser._id.toString(),
          remarks: 'No show'
        })
      })

      expect(response.status).toBe(200)

      // Verify participant removed even without waitlist
      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.participants).not.toContainEqual(regularUser._id)
    })
  })

  describe('Admin manages interest tags', () => {
    it('should create interest tag', async () => {
      const tagData = {
        name: 'coding',
        description: 'For programmers and developers',
        color: '#3B82F6',
        isActive: true
      }

      const response = await fetch('http://localhost:3000/api/admin/tags', {
        method: 'POST',
        headers: {
          'Cookie': adminAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tagData)
      })

      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data.tag).toBeDefined()
      expect(data.tag.name).toBe('coding')
      expect(data.tag.color).toBe('#3B82F6')

      // Verify tag saved to database
      const tag = await InterestTag.findOne({ name: 'coding' })
      expect(tag).toBeDefined()
      expect(tag?.isActive).toBe(true)
    })

    it('should update interest tag', async () => {
      const tag = await InterestTag.create({
        name: 'productivity',
        description: 'Focus and productivity',
        color: '#10B981',
        isActive: true
      })

      const updateData = {
        description: 'Updated description',
        color: '#EF4444'
      }

      const response = await fetch(`http://localhost:3000/api/admin/tags/${tag._id}`, {
        method: 'PATCH',
        headers: {
          'Cookie': adminAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      expect(response.status).toBe(200)

      // Verify changes saved
      const updatedTag = await InterestTag.findById(tag._id)
      expect(updatedTag?.description).toBe('Updated description')
      expect(updatedTag?.color).toBe('#EF4444')
    })

    it('should deactivate interest tag', async () => {
      const tag = await InterestTag.create({
        name: 'writing',
        description: 'For writers',
        color: '#8B5CF6',
        isActive: true
      })

      const response = await fetch(`http://localhost:3000/api/admin/tags/${tag._id}`, {
        method: 'DELETE',
        headers: {
          'Cookie': adminAuthCookie
        }
      })

      expect(response.status).toBe(200)

      // Verify tag deactivated
      const deactivatedTag = await InterestTag.findById(tag._id)
      expect(deactivatedTag?.isActive).toBe(false)
    })

    it('should not allow regular user to create tags', async () => {
      const tagData = {
        name: 'unauthorized',
        description: 'Should not be created',
        color: '#000000'
      }

      const response = await fetch('http://localhost:3000/api/admin/tags', {
        method: 'POST',
        headers: {
          'Cookie': userAuthCookie,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tagData)
      })

      expect(response.status).toBe(403)

      // Verify tag NOT created
      const tag = await InterestTag.findOne({ name: 'unauthorized' })
      expect(tag).toBeNull()
    })
  })
})
