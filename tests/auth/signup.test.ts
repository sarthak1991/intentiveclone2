import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

describe('Signup Flow', () => {
  beforeEach(async () => {
    await connectDB()
  })

  afterEach(async () => {
    await User.deleteMany({})
    await mongoose.disconnect()
  })

  it('should create user with email/password', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      })
    })

    const data = await response.json()
    expect(response.ok).toBe(true)
    expect(data.user.email).toBe('test@example.com')
    expect(data.user.name).toBe('Test User')

    const user = await User.findOne({ email: 'test@example.com' })
    expect(user).toBeTruthy()
    expect(user?.name).toBe('Test User')
    expect(user?.email).toBe('test@example.com')
    expect(user?.isOnboarded).toBe(false)
  })

  it('should reject weak passwords', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      })
    })

    const data = await response.json()
    expect(response.ok).toBe(false)
    expect(data.error).toContain('stronger')
  })

  it('should reject password without uppercase letters', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
    })

    const data = await response.json()
    expect(response.ok).toBe(false)
    expect(data.error).toContain('stronger')
  })

  it('should reject password without lowercase letters', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'PASSWORD123',
        name: 'Test User'
      })
    })

    const data = await response.json()
    expect(response.ok).toBe(false)
    expect(data.error).toContain('stronger')
  })

  it('should reject password shorter than 8 characters', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Pass1',
        name: 'Test User'
      })
    })

    const data = await response.json()
    expect(response.ok).toBe(false)
    expect(data.error).toContain('8 characters')
  })

  it('should reject duplicate email', async () => {
    await User.create({
      email: 'test@example.com',
      password: await bcrypt.hash('Password123', 10),
      name: 'Existing User'
    })

    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: 'New User'
      })
    })

    const data = await response.json()
    expect(response.ok).toBe(false)
    expect(data.error).toContain('already exists')
  })

  it('should reject invalid email format', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'Password123',
        name: 'Test User'
      })
    })

    const data = await response.json()
    expect(response.ok).toBe(false)
    expect(data.error).toContain("doesn't look quite right")
  })

  it('should reject empty name', async () => {
    const response = await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: ''
      })
    })

    const data = await response.json()
    expect(response.ok).toBe(false)
    expect(data.error).toContain('call you')
  })

  it('should hash password before saving', async () => {
    await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      })
    })

    const user = await User.findOne({ email: 'test@example.com' }).select('+password')
    expect(user?.password).toBeDefined()
    expect(user?.password).not.toBe('Password123')
    const isValid = await bcrypt.compare('Password123', user?.password || '')
    expect(isValid).toBe(true)
  })

  it('should initialize user with default values', async () => {
    await fetch('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      })
    })

    const user = await User.findOne({ email: 'test@example.com' })
    expect(user?.timezone).toBe('UTC')
    expect(user?.interests).toEqual([])
    expect(user?.isOnboarded).toBe(false)
  })
})
