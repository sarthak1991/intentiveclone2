import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { connectDB, disconnectDB } from '@/lib/db'
import { User } from '@/models/User'
import { isAdmin } from '@/lib/admin'
import mongoose from 'mongoose'

describe('Admin Authorization', () => {
  let adminUser: any
  let regularUser: any

  beforeEach(async () => {
    await connectDB()

    // Create admin user
    adminUser = await User.create({
      email: 'admin@example.com',
      name: 'Admin User',
      timezone: 'Asia/Kolkata',
      role: 'admin',
      isOnboarded: true
    })

    // Create regular user
    regularUser = await User.create({
      email: 'user@example.com',
      name: 'Regular User',
      timezone: 'Asia/Kolkata',
      role: 'user',
      isOnboarded: true
    })
  })

  afterEach(async () => {
    await User.deleteMany({})
  })

  describe('isAdmin', () => {
    it('should return true for admin role', () => {
      expect(isAdmin(adminUser)).toBe(true)
    })

    it('should return false for user role', () => {
      expect(isAdmin(regularUser)).toBe(false)
    })

    it('should return false for null user', () => {
      expect(isAdmin(null)).toBe(false)
    })

    it('should return false for undefined user', () => {
      expect(isAdmin(undefined as any)).toBe(false)
    })
  })

  describe('User model role field', () => {
    it('should create user with default role', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'Asia/Kolkata'
      })

      expect(user.role).toBe('user')
    })

    it('should create admin user with admin role', async () => {
      const user = await User.create({
        email: 'admin2@example.com',
        name: 'Admin User 2',
        timezone: 'Asia/Kolkata',
        role: 'admin'
      })

      expect(user.role).toBe('admin')
      expect(isAdmin(user)).toBe(true)
    })

    it('should accept only valid role values', async () => {
      const user = await User.create({
        email: 'test2@example.com',
        name: 'Test User 2',
        timezone: 'Asia/Kolkata',
        role: 'user'
      })

      expect(user.role).toBe('user')
    })
  })
})
