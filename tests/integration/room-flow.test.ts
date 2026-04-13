import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

describe('Integration: User Room Flow', () => {
  let regularUser: any
  let adminUser: any
  let authCookie: string

  beforeAll(async () => {
    await connectDB()

    // Create test users
    const hashedPassword = await bcrypt.hash('Password123', 10)

    regularUser = await User.create({
      email: 'regular@example.com',
      password: hashedPassword,
      name: 'Regular User',
      isOnboarded: true,
      timezone: 'Asia/Kolkata'
    })

    adminUser = await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      isOnboarded: true,
      role: 'admin',
      timezone: 'Asia/Kolkata'
    })

    // Login to get auth cookie
    const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'regular@example.com',
        password: 'Password123'
      })
    })

    if (loginResponse.ok) {
      const cookies = loginResponse.headers.get('set-cookie')
      authCookie = cookies || ''
    }
  })

  afterAll(async () => {
    await User.deleteMany({})
    await Room.deleteMany({})
    await Registration.deleteMany({})
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    // Clean up rooms and registrations before each test
    await Room.deleteMany({})
    await Registration.deleteMany({})
  })

  describe('User views room list', () => {
    it('should return 8 rooms for today', async () => {
      // Create 8 rooms for today
      const now = new Date()
      const baseTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0) // 9 AM today

      for (let i = 0; i < 8; i++) {
        const scheduledTime = new Date(baseTime.getTime() + i * 60 * 60 * 1000) // Every hour
        await Room.create({
          title: `Focus Room ${i + 1}`,
          scheduledTime,
          duration: 45,
          capacity: 12,
          status: 'scheduled'
        })
      }

      const response = await fetch('http://localhost:3000/api/rooms', {
        headers: {
          'Cookie': authCookie
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()

      expect(data.rooms).toBeDefined()
      expect(data.rooms.length).toBe(8)
      expect(data.rooms[0].displayTime).toBeDefined()
      expect(data.rooms[0].registrationStatus).toBeDefined()
    })

    it('should include displayTime in user timezone', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)

      await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      const response = await fetch('http://localhost:3000/api/rooms', {
        headers: {
          'Cookie': authCookie
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()

      expect(data.rooms[0].displayTime).toBeDefined()
      expect(typeof data.rooms[0].displayTime).toBe('string')
    })

    it('should include registrationStatus for each room', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0)

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      // Register user for the room
      await Registration.create({
        userId: regularUser._id,
        roomId: room._id,
        status: 'registered'
      })

      const response = await fetch('http://localhost:3000/api/rooms', {
        headers: {
          'Cookie': authCookie
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()

      expect(data.rooms[0].registrationStatus).toBe('registered')
    })
  })

  describe('User registers for room (within 30-min window)', () => {
    it('should allow registration 20 minutes before session', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 20 * 60 * 1000) // 20 minutes from now

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'open'
      })

      const response = await fetch(`http://localhost:3000/api/rooms/${room._id}/register`, {
        method: 'POST',
        headers: {
          'Cookie': authCookie,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(201)
      const data = await response.json()

      expect(data.room).toBeDefined()
      expect(data.room.participants).toContainEqual(regularUser._id.toString())

      // Verify registration document created
      const registration = await Registration.findOne({
        userId: regularUser._id,
        roomId: room._id
      })
      expect(registration).toBeDefined()
      expect(registration?.status).toBe('registered')
    })

    it('should add user to room participants', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 20 * 60 * 1000)

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'open'
      })

      await fetch(`http://localhost:3000/api/rooms/${room._id}/register`, {
        method: 'POST',
        headers: {
          'Cookie': authCookie,
          'Content-Type': 'application/json'
        }
      })

      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.participants).toContainEqual(regularUser._id)
    })
  })

  describe('User cannot register before 30-min window', () => {
    it('should reject registration 40 minutes before session', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 40 * 60 * 1000) // 40 minutes from now

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'scheduled'
      })

      const response = await fetch(`http://localhost:3000/api/rooms/${room._id}/register`, {
        method: 'POST',
        headers: {
          'Cookie': authCookie,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(400)
      const data = await response.json()

      expect(data.error).toBeDefined()
      expect(data.error).toContain('30 minutes')

      // Verify user NOT added to participants
      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.participants).not.toContainEqual(regularUser._id)
    })
  })

  describe('User cannot register for full room', () => {
    it('should reject registration when room is at capacity', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 20 * 60 * 1000)

      // Create 12 test users
      const testUsers = await User.create(
        Array.from({ length: 12 }, (_, i) => ({
          email: `testuser${i}@example.com`,
          password: bcrypt.hashSync('Password123', 10),
          name: `Test User ${i}`,
          isOnboarded: true
        }))
      )

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 12,
        status: 'full',
        participants: testUsers.map(u => u._id)
      })

      const response = await fetch(`http://localhost:3000/api/rooms/${room._id}/register`, {
        method: 'POST',
        headers: {
          'Cookie': authCookie,
          'Content-Type': 'application/json'
        }
      })

      expect(response.status).toBe(400)
      const data = await response.json()

      expect(data.error).toBeDefined()
      expect(data.error).toContain('full')

      // Verify user NOT added to participants
      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.participants.length).toBe(12)
      expect(updatedRoom?.participants).not.toContainEqual(regularUser._id)
    })
  })

  describe('User cancels registration', () => {
    it('should remove user from participants', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 20 * 60 * 1000)

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

      const response = await fetch(`http://localhost:3000/api/rooms/${room._id}/register`, {
        method: 'DELETE',
        headers: {
          'Cookie': authCookie
        }
      })

      expect(response.status).toBe(200)

      // Verify user removed from participants
      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.participants).not.toContainEqual(regularUser._id)

      // Verify registration status cancelled
      const registration = await Registration.findOne({
        userId: regularUser._id,
        roomId: room._id
      })
      expect(registration?.status).toBe('cancelled')
    })
  })

  describe('Race condition protection', () => {
    it('should only allow 1 registration when capacity is 1', async () => {
      const now = new Date()
      const scheduledTime = new Date(now.getTime() + 20 * 60 * 1000)

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: 45,
        capacity: 1,
        status: 'open'
      })

      // Create 10 test users
      const testUsers = await User.create(
        Array.from({ length: 10 }, (_, i) => ({
          email: `raceuser${i}@example.com`,
          password: bcrypt.hashSync('Password123', 10),
          name: `Race User ${i}`,
          isOnboarded: true
        }))
      )

      // Send 10 concurrent registration requests
      const registrationPromises = testUsers.map(async (user) => {
        // Login as this user
        const loginRes = await fetch('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            password: 'Password123'
          })
        })

        const cookie = loginRes.headers.get('set-cookie') || ''

        // Attempt to register
        return fetch(`http://localhost:3000/api/rooms/${room._id}/register`, {
          method: 'POST',
          headers: {
            'Cookie': cookie,
            'Content-Type': 'application/json'
          }
        })
      })

      const results = await Promise.all(registrationPromises)

      const successCount = results.filter(r => r.status === 201).length
      const failureCount = results.filter(r => r.status === 400).length

      // Only 1 should succeed
      expect(successCount).toBe(1)
      expect(failureCount).toBe(9)

      // Verify room has exactly 1 participant
      const updatedRoom = await Room.findById(room._id)
      expect(updatedRoom?.participants.length).toBe(1)
    })
  })
})
