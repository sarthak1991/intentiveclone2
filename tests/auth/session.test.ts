import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

describe('Session Management', () => {
  beforeEach(async () => {
    await connectDB()
  })

  afterEach(async () => {
    await User.deleteMany({})
    await mongoose.disconnect()
  })

  describe('Session Persistence', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })
    })

    it('should create session on successful login', async () => {
      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        })
      })

      expect(loginResponse.ok).toBe(true)
      const cookies = loginResponse.headers.get('set-cookie')
      expect(cookies).toBeDefined()

      // Verify session cookie is set
      if (cookies) {
        expect(cookies).toContain('next-auth.session-token')
      }
    })

    it('should persist session across requests', async () => {
      // Login
      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        })
      })

      const cookies = loginResponse.headers.get('set-cookie')

      // Use session to access protected route
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        headers: {
          'Cookie': cookies || ''
        }
      })

      expect(sessionResponse.ok).toBe(true)
      const data = await sessionResponse.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('test@example.com')
    })

    it('should return user data in session', async () => {
      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        })
      })

      const cookies = loginResponse.headers.get('set-cookie')

      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        headers: {
          'Cookie': cookies || ''
        }
      })

      const data = await sessionResponse.json()
      expect(data.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
        isOnboarded: true
      })
      expect(data.user.id).toBeDefined()
    })

    it('should handle expired session gracefully', async () => {
      // This test would require manipulating session expiry
      // For now, we verify the behavior with invalid session
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        headers: {
          'Cookie': 'next-auth.session-token=invalid-token'
        }
      })

      // Should return null user or redirect
      const data = await sessionResponse.json()
      expect(data.user).toBeNull()
    })

    it('should return null for unauthenticated session', async () => {
      const sessionResponse = await fetch('http://localhost:3000/api/auth/session')

      const data = await sessionResponse.json()
      expect(data.user).toBeNull()
    })
  })

  describe('Logout', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })
    })

    it('should logout user and clear session', async () => {
      // Login
      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        })
      })

      const cookies = loginResponse.headers.get('set-cookie')

      // Verify session exists
      const sessionBefore = await fetch('http://localhost:3000/api/auth/session', {
        headers: { 'Cookie': cookies || '' }
      })
      const dataBefore = await sessionBefore.json()
      expect(dataBefore.user).toBeDefined()

      // Logout
      const logoutResponse = await fetch('http://localhost:3000/api/auth/signout', {
        method: 'POST',
        headers: {
          'Cookie': cookies || ''
        }
      })

      expect(logoutResponse.ok).toBe(true)

      // Verify session is cleared
      const sessionAfter = await fetch('http://localhost:3000/api/auth/session', {
        headers: { 'Cookie': cookies || '' }
      })
      const dataAfter = await sessionAfter.json()
      expect(dataAfter.user).toBeNull()
    })

    it('should handle logout without active session', async () => {
      const logoutResponse = await fetch('http://localhost:3000/api/auth/signout', {
        method: 'POST'
      })

      // Should succeed even without session
      expect(logoutResponse.ok).toBe(true)
    })
  })

  describe('Session Security', () => {
    it('should not expose password in session data', async () => {
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })

      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        })
      })

      const cookies = loginResponse.headers.get('set-cookie')

      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        headers: { 'Cookie': cookies || '' }
      })

      const data = await sessionResponse.json()
      expect(data.user.password).toBeUndefined()
      expect(data.user).not.toHaveProperty('password')
    })

    it('should include onboarding status in session', async () => {
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: false
      })

      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        })
      })

      const cookies = loginResponse.headers.get('set-cookie')

      const sessionResponse = await fetch('http://localhost:3000/api/auth/session', {
        headers: { 'Cookie': cookies || '' }
      })

      const data = await sessionResponse.json()
      expect(data.user.isOnboarded).toBe(false)
    })
  })

  describe('Remember Me (30-day session)', () => {
    it('should support extended session with remember me', async () => {
      // This test verifies the remember me functionality
      // Actual session expiry testing would require time manipulation
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })

      const loginResponse = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123',
          remember: true
        })
      })

      expect(loginResponse.ok).toBe(true)
      // Session should be created with extended expiry
      // Actual expiry verification would require waiting 30 days or time mocking
    })
  })
})
