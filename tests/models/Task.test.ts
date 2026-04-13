import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { Task } from '@/models/Task'
import { SessionCompletion } from '@/models/SessionCompletion'
import { User } from '@/models/User'
import { Room } from '@/models/Room'

// Shared setup for all test suites
beforeAll(async () => {
  await connectDB()
})

afterAll(async () => {
  await mongoose.disconnect()
})

beforeEach(async () => {
  await Task.deleteMany({})
  await SessionCompletion.deleteMany({})
  await User.deleteMany({})
  await Room.deleteMany({})
})

describe('Task Model', () => {

  it('should create task with default values', async () => {
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

    const task = await Task.create({
      userId: user._id,
      roomId: room._id,
      taskText: 'Complete project documentation'
    })

    expect(task.taskText).toBe('Complete project documentation')
    expect(task.userId).toEqual(user._id)
    expect(task.roomId).toEqual(room._id)
    expect(task.isCompleted).toBe(false)
    expect(task.carriedOver).toBe(false)
    expect(task.submittedAt).toBeInstanceOf(Date)
  })

  it('should enforce taskText min 1, max 100 characters', async () => {
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

    // Test minimum length (1 character)
    const room2 = await Room.create({
      scheduledTime: new Date('2026-04-07T10:00:00Z')
    })
    const taskMin = await Task.create({
      userId: user._id,
      roomId: room2._id,
      taskText: 'A'
    })
    expect(taskMin.taskText).toBe('A')

    // Test maximum length (100 characters)
    const room3 = await Room.create({
      scheduledTime: new Date('2026-04-07T11:00:00Z')
    })
    const hundredChars = 'A'.repeat(100)
    const taskMax = await Task.create({
      userId: user._id,
      roomId: room3._id,
      taskText: hundredChars
    })
    expect(taskMax.taskText).toBe(hundredChars)

    // Test exceeding maximum length
    await expect(Task.create({
      userId: user._id,
      roomId: room._id,
      taskText: 'A'.repeat(101)
    })).rejects.toThrow()
  })

  it('should require userId, roomId, taskText fields', async () => {
    // Missing userId
    await expect(Task.create({
      roomId: new mongoose.Types.ObjectId(),
      taskText: 'Test task'
    })).rejects.toThrow()

    // Missing roomId
    await expect(Task.create({
      userId: new mongoose.Types.ObjectId(),
      taskText: 'Test task'
    })).rejects.toThrow()

    // Missing taskText
    await expect(Task.create({
      userId: new mongoose.Types.ObjectId(),
      roomId: new mongoose.Types.ObjectId()
    })).rejects.toThrow()
  })

  it('should set default values for isCompleted (false), carriedOver (false)', async () => {
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

    const task = await Task.create({
      userId: user._id,
      roomId: room._id,
      taskText: 'Test task'
    })

    expect(task.isCompleted).toBe(false)
    expect(task.carriedOver).toBe(false)
  })

  it('should enforce compound unique index on userId + roomId', async () => {
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

    await Task.create({
      userId: user._id,
      roomId: room._id,
      taskText: 'First task'
    })

    // Attempt to create duplicate task for same user and room
    await expect(Task.create({
      userId: user._id,
      roomId: room._id,
      taskText: 'Second task'
    })).rejects.toThrow()

    // Different user should be allowed
    const user2 = await User.create({
      email: 'test2@example.com',
      password: 'password123',
      name: 'Test User 2',
      timezone: 'UTC',
      interests: [],
      isOnboarded: true
    })

    const task2 = await Task.create({
      userId: user2._id,
      roomId: room._id,
      taskText: 'Task for different user'
    })
    expect(task2).toBeDefined()
  })

  it('should allow marking task as completed', async () => {
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

    const task = await Task.create({
      userId: user._id,
      roomId: room._id,
      taskText: 'Test task'
    })

    expect(task.isCompleted).toBe(false)
    expect(task.completedAt).toBeUndefined()

    const completedAt = new Date()
    task.isCompleted = true
    task.completedAt = completedAt
    await task.save()

    const updatedTask = await Task.findById(task._id)
    expect(updatedTask?.isCompleted).toBe(true)
    expect(updatedTask?.completedAt).toEqual(completedAt)
  })
})

describe('SessionCompletion Model', () => {
  it('should create session completion with required fields', async () => {
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

    const completion = await SessionCompletion.create({
      userId: user._id,
      roomId: room._id,
      completed: true
    })

    expect(completion.userId).toEqual(user._id)
    expect(completion.roomId).toEqual(room._id)
    expect(completion.completed).toBe(true)
  })

  it('should require userId, roomId, completed fields', async () => {
    // Missing userId
    await expect(SessionCompletion.create({
      roomId: new mongoose.Types.ObjectId(),
      completed: true
    })).rejects.toThrow()

    // Missing roomId
    await expect(SessionCompletion.create({
      userId: new mongoose.Types.ObjectId(),
      completed: true
    })).rejects.toThrow()

    // Missing completed
    await expect(SessionCompletion.create({
      userId: new mongoose.Types.ObjectId(),
      roomId: new mongoose.Types.ObjectId()
    })).rejects.toThrow()
  })

  it('should allow optional attendedAt timestamp', async () => {
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

    const attendedAt = new Date('2026-04-07T09:05:00Z')
    const completion = await SessionCompletion.create({
      userId: user._id,
      roomId: room._id,
      completed: true,
      attendedAt
    })

    expect(completion.attendedAt).toEqual(attendedAt)
  })

  it('should allow optional incompleteReason', async () => {
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

    const completion = await SessionCompletion.create({
      userId: user._id,
      roomId: room._id,
      completed: false,
      incompleteReason: 'Left session early due to emergency'
    })

    expect(completion.completed).toBe(false)
    expect(completion.incompleteReason).toBe('Left session early due to emergency')
  })

  it('should allow taskCompletedAt timestamp', async () => {
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

    const taskCompletedAt = new Date('2026-04-07T09:30:00Z')
    const completion = await SessionCompletion.create({
      userId: user._id,
      roomId: room._id,
      completed: true,
      taskCompletedAt
    })

    expect(completion.taskCompletedAt).toEqual(taskCompletedAt)
  })
})
