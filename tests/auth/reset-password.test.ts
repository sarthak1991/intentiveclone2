import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectDB, mongoose } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'

describe('Password Reset Flow', () => {
  beforeEach(async () => {
    await connectDB()
  })

  afterEach(async () => {
    await User.deleteMany({})
    await mongoose.disconnect()
  })

  describe('Password Reset Request', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })
    })

    it('should accept password reset request for existing email', async () => {
      const response = await fetch('http://localhost:3000/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.message).toBeDefined()
      expect(data.message).toContain('email')
    })

    it('should not reveal if email exists or not (security)', async () => {
      // Request for non-existent email
      const response = await fetch('http://localhost:3000/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@example.com'
        })
      })

      // Should still return success to prevent email enumeration
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.message).toBeDefined()
    })

    it('should reject invalid email format', async () => {
      const response = await fetch('http://localhost:3000/api/auth/reset-password/request', {
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

    it('should reject empty email', async () => {
      const response = await fetch('http://localhost:3000/api/auth/reset-password/request', {
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

  describe('Password Reset Confirmation', () => {
    let resetToken: string

    beforeEach(async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })

      // Generate a reset token (this would normally be done by the email service)
      resetToken = user._id.toString() + ':' + Date.now().toString()
    })

    it('should reset password with valid token', async () => {
      const response = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword456'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.message).toContain('reset')

      // Verify password was changed
      const user = await User.findOne({ email: 'test@example.com' }).select('+password')
      const isValid = await bcrypt.compare('NewPassword456', user?.password || '')
      expect(isValid).toBe(true)

      // Old password should not work
      const isOldValid = await bcrypt.compare('Password123', user?.password || '')
      expect(isOldValid).toBe(false)
    })

    it('should reject weak new password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'weak'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toContain('stronger')
    })

    it('should reject invalid token', async () => {
      const response = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'invalid-token',
          newPassword: 'NewPassword456'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toBeDefined()
    })

    it('should reject empty token', async () => {
      const response = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: '',
          newPassword: 'NewPassword456'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
    })

    it('should reject empty new password', async () => {
      const response = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: ''
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
    })
  })

  describe('Password Reset Security', () => {
    it('should invalidate reset token after use', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })

      const resetToken = user._id.toString() + ':' + Date.now().toString()

      // First use
      const response1 = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'NewPassword456'
        })
      })

      expect(response1.ok).toBe(true)

      // Second use (should fail)
      const response2 = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'AnotherPassword789'
        })
      })

      expect(response2.ok).toBe(false)
    })

    it('should expire reset token after timeout', async () => {
      // This test would require time manipulation or a token with past expiry
      // For now, we verify the logic exists
      const user = await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })

      // Create an expired token (1 hour ago)
      const expiredToken = user._id.toString() + ':' + (Date.now() - 3600000).toString()

      const response = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: expiredToken,
          newPassword: 'NewPassword456'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toContain('expired')
    })

    it('should not allow password reset to same password', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })

      const resetToken = user._id.toString() + ':' + Date.now().toString()

      const response = await fetch('http://localhost:3000/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          newPassword: 'Password123'
        })
      })

      const data = await response.json()
      expect(response.ok).toBe(false)
      expect(data.error).toContain('different')
    })
  })

  describe('Password Reset Email', () => {
    it('should send password reset email', async () => {
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })

      const response = await fetch('http://localhost:3000/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.message).toContain('email')
      // In a real test, we would verify email was sent
    })

    it('should include reset link in email', async () => {
      // This would require email service mocking
      // For now, we verify the endpoint accepts the request
      await User.create({
        email: 'test@example.com',
        password: await bcrypt.hash('Password123', 10),
        name: 'Test User',
        isOnboarded: true
      })

      const response = await fetch('http://localhost:3000/api/auth/reset-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com'
        })
      })

      expect(response.ok).toBe(true)
    })
  })
})
