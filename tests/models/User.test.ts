import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { User } from '@/models/User'
import type { IUser } from '@/models'

describe('User Model', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await mongoose.disconnect()
  })

  beforeEach(async () => {
    await User.deleteMany({})
  })

  it('should create a user with required fields', async () => {
    const userData: Partial<IUser> = {
      email: 'test@example.com',
      name: 'Test User',
      timezone: 'UTC',
      interests: [],
      isOnboarded: false
    }

    const user = await User.create(userData)
    expect(user.email).toBe('test@example.com')
    expect(user.name).toBe('Test User')
    expect(user.timezone).toBe('UTC')
  })

  it('should enforce unique email constraint', async () => {
    await User.create({
      email: 'test@example.com',
      name: 'User 1',
      timezone: 'UTC'
    })

    await expect(User.create({
      email: 'test@example.com',
      name: 'User 2',
      timezone: 'UTC'
    })).rejects.toThrow()
  })

  it('should not return password by default', async () => {
    const user = await User.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      timezone: 'UTC'
    })

    const foundUser = await User.findOne({ email: 'test@example.com' })
    expect(foundUser?.password).toBeUndefined()
  })
})
