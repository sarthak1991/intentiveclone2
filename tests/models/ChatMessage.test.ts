import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { ChatMessage } from '@/models/ChatMessage'
import { User } from '@/models/User'
import { Room } from '@/models/Room'

describe('ChatMessage Model', () => {
  let testUser: any
  let testRoom: any

  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await ChatMessage.deleteMany({})
    await Room.deleteMany({})
    await User.deleteMany({})

    // Create test user
    testUser = await User.create({
      email: 'chat@example.com',
      password: 'password123',
      name: 'Chat Test User',
      timezone: 'UTC',
      interests: ['testing'],
      isOnboarded: true,
      photoUrl: 'https://example.com/photo.jpg'
    })

    // Create test room
    testRoom = await Room.create({
      scheduledTime: new Date('2026-04-07T09:00:00Z'),
      status: 'open'
    })
  })

  it('should create chat message with all fields', async () => {
    const message = await ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name,
      userPhoto: testUser.photoUrl,
      message: 'Hello, this is a test message!'
    })

    expect(message.roomId).toEqual(testRoom._id)
    expect(message.userId).toEqual(testUser._id)
    expect(message.userName).toBe(testUser.name)
    expect(message.userPhoto).toBe(testUser.photoUrl)
    expect(message.message).toBe('Hello, this is a test message!')
    expect(message.timestamp).toBeInstanceOf(Date)
    expect(message.createdAt).toBeInstanceOf(Date)
    expect(message.updatedAt).toBeInstanceOf(Date)
  })

  it('should enforce message max length (500 chars)', async () => {
    const longMessage = 'a'.repeat(500)
    const tooLongMessage = 'a'.repeat(501)

    // Test exactly 500 characters (should pass)
    const validMessage = await ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name,
      message: longMessage
    })
    expect(validMessage.message).toHaveLength(500)

    // Test 501 characters (should fail)
    await expect(ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name,
      message: tooLongMessage
    })).rejects.toThrow()
  })

  it('should require roomId, userId, userName, and message', async () => {
    // Test missing roomId
    await expect(ChatMessage.create({
      userId: testUser._id,
      userName: testUser.name,
      message: 'Test message'
    } as any)).rejects.toThrow()

    // Test missing userId
    await expect(ChatMessage.create({
      roomId: testRoom._id,
      userName: testUser.name,
      message: 'Test message'
    } as any)).rejects.toThrow()

    // Test missing userName
    await expect(ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      message: 'Test message'
    } as any)).rejects.toThrow()

    // Test missing message
    await expect(ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name
    } as any)).rejects.toThrow()
  })

  it('should allow optional userPhoto field', async () => {
    const message = await ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name,
      message: 'Test message without photo'
    })

    expect(message.userPhoto).toBeUndefined()
  })

  it('should populate userId and roomId refs', async () => {
    const message = await ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name,
      message: 'Test message for population'
    })

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('userId')
      .populate('roomId')

    expect(populatedMessage?.userId).toBeDefined()
    expect(populatedMessage?.roomId).toBeDefined()
  })

  it('should query room messages efficiently using compound index', async () => {
    const anotherRoom = await Room.create({
      scheduledTime: new Date('2026-04-07T10:00:00Z'),
      status: 'open'
    })

    // Create messages for testRoom
    for (let i = 0; i < 5; i++) {
      await ChatMessage.create({
        roomId: testRoom._id,
        userId: testUser._id,
        userName: testUser.name,
        message: `Room 1 message ${i}`
      })
    }

    // Create messages for anotherRoom
    for (let i = 0; i < 3; i++) {
      await ChatMessage.create({
        roomId: anotherRoom._id,
        userId: testUser._id,
        userName: testUser.name,
        message: `Room 2 message ${i}`
      })
    }

    // Query messages for testRoom only
    const room1Messages = await ChatMessage.find({
      roomId: testRoom._id
    }).sort({ timestamp: -1 })

    expect(room1Messages).toHaveLength(5)
    expect(room1Messages[0].message).toBe('Room 1 message 4')
    expect(room1Messages[4].message).toBe('Room 1 message 0')

    // Query messages for anotherRoom only
    const room2Messages = await ChatMessage.find({
      roomId: anotherRoom._id
    }).sort({ timestamp: -1 })

    expect(room2Messages).toHaveLength(3)
  })

  it('should sort messages by timestamp descending', async () => {
    // Create messages with slight delays to ensure different timestamps
    const message1 = await ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name,
      message: 'First message'
    })

    await new Promise(resolve => setTimeout(resolve, 10))

    const message2 = await ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name,
      message: 'Second message'
    })

    await new Promise(resolve => setTimeout(resolve, 10))

    const message3 = await ChatMessage.create({
      roomId: testRoom._id,
      userId: testUser._id,
      userName: testUser.name,
      message: 'Third message'
    })

    const messages = await ChatMessage.find({
      roomId: testRoom._id
    }).sort({ timestamp: -1 })

    expect(messages[0]._id).toEqual(message3._id)
    expect(messages[1]._id).toEqual(message2._id)
    expect(messages[2]._id).toEqual(message1._id)
  })

  it('should handle message count for rate limiting', async () => {
    const oneMinuteAgo = new Date(Date.now() - 60000)

    // Create 5 messages within the last minute
    for (let i = 0; i < 5; i++) {
      await ChatMessage.create({
        roomId: testRoom._id,
        userId: testUser._id,
        userName: testUser.name,
        message: `Message ${i}`,
        timestamp: new Date(Date.now() - 30000) // 30 seconds ago
      })
    }

    // Create 5 messages older than 1 minute
    for (let i = 0; i < 5; i++) {
      await ChatMessage.create({
        roomId: testRoom._id,
        userId: testUser._id,
        userName: testUser.name,
        message: `Old message ${i}`,
        timestamp: new Date(Date.now() - 120000) // 2 minutes ago
      })
    }

    // Count recent messages (within last minute)
    const recentCount = await ChatMessage.countDocuments({
      userId: testUser._id,
      timestamp: { $gte: oneMinuteAgo }
    })

    expect(recentCount).toBe(5)
  })
})
