import { describe, it, expect } from 'vitest'
import { signupSchema, loginSchema, magicLinkSchema, resetPasswordSchema, authErrorMessages } from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('signupSchema', () => {
    it('should validate valid signup input', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        name: 'Test User'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = signupSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123',
        name: 'Test User'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const firstError = result.error.issues[0]
        expect(firstError.message).toBe(authErrorMessages.invalidEmail)
      }
    })

    it('should reject weak password', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User'
      })
      expect(result.success).toBe(false)
    })

    it('should reject password without mixed case', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const firstError = result.error.issues[0]
        expect(firstError.message).toBe(authErrorMessages.weakPassword)
      }
    })

    it('should reject empty name', () => {
      const result = signupSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123',
        name: ''
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const firstError = result.error.issues[0]
        expect(firstError.message).toBe(authErrorMessages.nameRequired)
      }
    })
  })

  describe('loginSchema', () => {
    it('should validate valid login input', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = loginSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123'
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty password', () => {
      const result = loginSchema.safeParse({
        email: 'test@example.com',
        password: ''
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        const firstError = result.error.issues[0]
        expect(firstError.message).toBe(authErrorMessages.passwordRequired)
      }
    })
  })

  describe('magicLinkSchema', () => {
    it('should validate valid email', () => {
      const result = magicLinkSchema.safeParse({
        email: 'test@example.com'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = magicLinkSchema.safeParse({
        email: 'invalid-email'
      })
      expect(result.success).toBe(false)
    })
  })

  describe('resetPasswordSchema', () => {
    it('should validate valid email', () => {
      const result = resetPasswordSchema.safeParse({
        email: 'test@example.com'
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = resetPasswordSchema.safeParse({
        email: 'invalid-email'
      })
      expect(result.success).toBe(false)
    })
  })
})
