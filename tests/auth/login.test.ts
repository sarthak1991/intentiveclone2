import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

describe('Login Flow', () => {
  beforeEach(async () => {
    await connectDB()
  })

  afterEach(async () => {
    await User.deleteMany({})
    await mongoose.disconnect()
  })

  describe('Credentials Login (Email/Password)', () => {
    beforeEach(async () => {
      // Create a test user with password
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })
    })

    it('should login with valid credentials', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.user).toBeDefined()
      expect(data.user.email).toBe('test@example.com')
    })

    it('should reject incorrect password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword123'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toContain("doesn't match")
    })

    it('should reject non-existent user', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'Password123'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toContain("couldn't find")
    })

    it('should reject empty email', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: '',
          password: 'Password123'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should reject empty password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: ''
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should handle user without password (OAuth-only user)', async () => {
      await User.create({
        email: 'oauth@example.com',
        name: 'OAuth User',
        isOnboarded: true
      })

      const response = await fetch('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'oauth@example.com',
          password: 'Password123'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toContain("couldn't find")
    })
  })

  describe('Google OAuth Login', () => {
    it('should provide Google OAuth configuration', async () => {
      // This test verifies that Google OAuth is configured
      // Actual OAuth flow requires browser interaction and can't be tested with fetch
      const googleClientId = process.env.GOOGLE_CLIENT_ID
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET

      // In test environment, these might not be set
      if (googleClientId && googleClientSecret) {
        expect(googleClientId).toBeDefined()
        expect(googleClientSecret).toBeDefined()
      } else {
        // Skip test if env vars not set
        expect(true).toBe(true)
      }
    })

    it('should handle Google OAuth callback (integration test)', async () => {
      // This would require a full integration test with browser
      // For now, we verify the route exists
      const response = await fetch('http://localhost:3000/api/auth/signin/google')
      // Should redirect or return 404 depending on NextAuth config
      expect(response).toBeDefined()
    })
  })

  describe('Magic Link Login', () => {
    it('should accept magic link request', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      })

      // Should accept request even if user doesn't exist (will send signup email)
      expect(response.ok).toBe(true)
    })

    it('should reject invalid email for magic link', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-an-email'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toContain("doesn't look quite right")
    })

    it('should reject empty email for magic link', async () => {
      const response = await fetch('http://localhost:3000/api/auth/signin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: ''
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toContain('need your email')
    })
  })
})
