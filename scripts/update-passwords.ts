/**
 * Update passwords for test users
 *
 * Updates both users to use: Password123!
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

async function updatePasswords() {
  try {
    console.log('🔄 Updating passwords...')

    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/focusflow'
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to database')

    // Define User schema inline
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

    const User = mongoose.model('User', userSchema)

    // Update both users' passwords
    const newPassword = await bcrypt.hash('Password123!', 10)

    const userResult = await User.updateOne(
      { email: 'user@test.com' },
      { $set: { password: newPassword } }
    )

    const adminResult = await User.updateOne(
      { email: 'admin@test.com' },
      { $set: { password: newPassword } }
    )

    if (userResult.matchedCount === 0 || adminResult.matchedCount === 0) {
      console.log('⚠️  One or both users not found. Creating new users...')

      // Create regular user
      await User.create({
        email: 'user@test.com',
        password: newPassword,
        name: 'Test User',
        photoUrl: null,
        timezone: 'Asia/Kolkata',
        interests: ['Software Development', 'Productivity'],
        isOnboarded: true,
        role: 'user',
        emailVerified: new Date(),
      })
      console.log('✅ Created regular user: user@test.com')

      // Create admin user
      await User.create({
        email: 'admin@test.com',
        password: newPassword,
        name: 'Admin User',
        photoUrl: null,
        timezone: 'Asia/Kolkata',
        interests: ['Management', 'Coaching'],
        isOnboarded: true,
        role: 'admin',
        emailVerified: new Date(),
      })
      console.log('✅ Created admin user: admin@test.com')
    } else {
      console.log('✅ Updated password for: user@test.com')
      console.log('✅ Updated password for: admin@test.com')
    }

    console.log('\n✨ Passwords updated successfully!')
    console.log('\n📝 New Test Credentials:')
    console.log('Regular User: user@test.com / Password123!')
    console.log('Admin User: admin@test.com / Password123!')
  } catch (error) {
    console.error('❌ Update failed:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from database')
  }
}

// Run update
updatePasswords()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
