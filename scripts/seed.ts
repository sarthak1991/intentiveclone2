/**
 * Seed script to create dummy users for testing
 *
 * Creates:
 * - 1 regular user: user@test.com / Password123!
 * - 1 admin user: admin@test.com / Password123!
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

async function seed() {
  try {
    console.log('Starting seed...')

    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/focusflow'
    await mongoose.connect(mongoUri)
    console.log('Connected to database')

    // Define User schema inline (mirrors src/models/User.ts)
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true, lowercase: true, trim: true },
      password: { type: String, select: false },
      name: { type: String, required: true },
      photoUrl: { type: String, default: null },
      timezone: { type: String, default: 'UTC' },
      interests: [{ type: String }],
      isOnboarded: { type: Boolean, default: false },
      role: { type: String, enum: ['user', 'admin'], default: 'user' },
      emailVerified: { type: Date, default: null },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    })

    // Use existing model if already compiled (hot reload safety)
    const User = mongoose.models.User || mongoose.model('User', userSchema)

    const password = 'Password123!'
    const hashed = await bcrypt.hash(password, 10)

    // Upsert regular user
    await User.findOneAndUpdate(
      { email: 'user@test.com' },
      {
        email: 'user@test.com',
        password: hashed,
        name: 'Test User',
        photoUrl: null,
        timezone: 'Asia/Kolkata',
        interests: ['Software Development', 'Productivity'],
        isOnboarded: true,
        role: 'user',
        emailVerified: new Date(),
      },
      { upsert: true, new: true }
    )
    console.log('Upserted regular user: user@test.com')

    // Upsert admin user
    await User.findOneAndUpdate(
      { email: 'admin@test.com' },
      {
        email: 'admin@test.com',
        password: hashed,
        name: 'Admin User',
        photoUrl: null,
        timezone: 'Asia/Kolkata',
        interests: ['Management', 'Coaching'],
        isOnboarded: true,
        role: 'admin',
        emailVerified: new Date(),
      },
      { upsert: true, new: true }
    )
    console.log('Upserted admin user: admin@test.com')

    console.log('\nSeed complete!')
    console.log('Regular User : user@test.com  / Password123!')
    console.log('Admin User   : admin@test.com / Password123!')
  } catch (error) {
    console.error('Seed failed:', error)
    throw error
  } finally {
    await mongoose.disconnect()
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1))
