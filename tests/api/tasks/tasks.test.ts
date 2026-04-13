import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { Task } from '@/models/Task'
import { Room } from '@/models/Room'
import { User } from '@/models/User'
import { POST, GET } from '@/app/api/tasks/[roomId]/route'
import { GET as GetById, PATCH } from '@/app/api/tasks/[id]/route'

// Mock NextAuth session
vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}))

import { getServerSession } from 'next-auth'

describe('Task API Endpoints', () => {
  let user: any
  let room: any
  let mockSession: any

  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await Task.deleteMany({})
    await Room.deleteMany({})
    await User.deleteMany({})

    // Create test user
    user = await User.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    // Create test room
    room = await Room.create({
      scheduledTime: new Date('2026-04-07T09:00:00Z')
    })

    // Setup mock session
    mockSession = {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name
      }
    }

    vi.mocked(getServerSession).mockResolvedValue(mockSession)
  })

  describe('POST /api/tasks/[roomId]', () => {
    it('should create task with 100 char validation', async () => {
      const request = new Request('http://localhost:3000/api/tasks/' + room._id, {
        method: 'POST',
        body: JSON.stringify({ taskText: 'Complete my project documentation' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { roomId: room._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.taskText).toBe('Complete my project documentation')
      expect(data.taskId).toBeDefined()
    })

    it('should reject taskText exceeding 100 characters', async () => {
      const request = new Request('http://localhost:3000/api/tasks/' + room._id, {
        method: 'POST',
        body: JSON.stringify({ taskText: 'A'.repeat(101) }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { roomId: room._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should reject empty taskText', async () => {
      const request = new Request('http://localhost:3000/api/tasks/' + room._id, {
        method: 'POST',
        body: JSON.stringify({ taskText: '' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { roomId: room._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should return existing task if already submitted', async () => {
      // Create initial task
      await Task.create({
        userId: user._id,
        roomId: room._id,
        taskText: 'Original task'
      })

      const request = new Request('http://localhost:3000/api/tasks/' + room._id, {
        method: 'POST',
        body: JSON.stringify({ taskText: 'New task text' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { roomId: room._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.taskText).toBe('Original task') // Should return existing task
    })

    it('should require authentication', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null)

      const request = new Request('http://localhost:3000/api/tasks/' + room._id, {
        method: 'POST',
        body: JSON.stringify({ taskText: 'Test task' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { roomId: room._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)

      // Reset mock
      vi.mocked(getServerSession).mockResolvedValue(mockSession)
    })

    it('should return 404 for non-existent room', async () => {
      const fakeId = new mongoose.Types.ObjectId()

      const request = new Request('http://localhost:3000/api/tasks/' + fakeId, {
        method: 'POST',
        body: JSON.stringify({ taskText: 'Test task' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request, { params: { roomId: fakeId.toString() } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/tasks/[id]', () => {
    it('should retrieve task for authenticated user', async () => {
      const task = await Task.create({
        userId: user._id,
        roomId: room._id,
        taskText: 'My task'
      })

      const request = new Request('http://localhost:3000/api/tasks/' + task._id)

      const response = await GetById(request, { params: { id: task._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.taskText).toBe('My task')
    })

    it('should return 403 for different user', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
        timezone: 'UTC',
        interests: [],
        isOnboarded: true
      })

      const task = await Task.create({
        userId: otherUser._id,
        roomId: room._id,
        taskText: 'Other user task'
      })

      const request = new Request('http://localhost:3000/api/tasks/' + task._id)

      const response = await GetById(request, { params: { id: task._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
    })

    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      const request = new Request('http://localhost:3000/api/tasks/' + fakeId)

      const response = await GetById(request, { params: { id: fakeId.toString() } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })

  describe('PATCH /api/tasks/[id]', () => {
    it('should update task within 5-minute window', async () => {
      const task = await Task.create({
        userId: user._id,
        roomId: room._id,
        taskText: 'Original task',
        submittedAt: new Date() // Just now
      })

      const request = new Request('http://localhost:3000/api/tasks/' + task._id, {
        method: 'PATCH',
        body: JSON.stringify({ taskText: 'Updated task' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PATCH(request, { params: { id: task._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.taskText).toBe('Updated task')
    })

    it('should return 403 when edit window expired', async () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000)

      const task = await Task.create({
        userId: user._id,
        roomId: room._id,
        taskText: 'Old task',
        submittedAt: sixMinutesAgo
      })

      const request = new Request('http://localhost:3000/api/tasks/' + task._id, {
        method: 'PATCH',
        body: JSON.stringify({ taskText: 'Trying to update' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PATCH(request, { params: { id: task._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Edit window expired')
    })

    it('should allow task completion update anytime', async () => {
      const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000)

      const task = await Task.create({
        userId: user._id,
        roomId: room._id,
        taskText: 'My task',
        submittedAt: sixMinutesAgo,
        isCompleted: false
      })

      const request = new Request('http://localhost:3000/api/tasks/' + task._id, {
        method: 'PATCH',
        body: JSON.stringify({ isCompleted: true }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PATCH(request, { params: { id: task._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.isCompleted).toBe(true)
      expect(data.completedAt).toBeDefined()
    })

    it('should return 403 for different user', async () => {
      const otherUser = await User.create({
        email: 'other@example.com',
        password: 'password123',
        name: 'Other User',
        timezone: 'UTC',
        interests: [],
        isOnboarded: true
      })

      const task = await Task.create({
        userId: otherUser._id,
        roomId: room._id,
        taskText: 'Other user task'
      })

      const request = new Request('http://localhost:3000/api/tasks/' + task._id, {
        method: 'PATCH',
        body: JSON.stringify({ taskText: 'Trying to update' }),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await PATCH(request, { params: { id: task._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
    })
  })

  describe('GET /api/tasks/[roomId]', () => {
    it('should get task for current user in room', async () => {
      await Task.create({
        userId: user._id,
        roomId: room._id,
        taskText: 'My room task'
      })

      const request = new Request('http://localhost:3000/api/tasks/' + room._id)

      const response = await GET(request, { params: { roomId: room._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.taskText).toBe('My room task')
    })

    it('should return 404 when no task exists', async () => {
      const request = new Request('http://localhost:3000/api/tasks/' + room._id)

      const response = await GET(request, { params: { roomId: room._id.toString() } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
    })
  })
})
