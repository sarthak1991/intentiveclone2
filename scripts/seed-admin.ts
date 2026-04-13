import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../src/lib/db'
import { User } from '../src/models/User'

async function seedAdmin() {
  try {
    await connectDB()

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@test.com' })
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.email)
      console.log('Role:', existingAdmin.role)
      process.exit(0)
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('Password123!', 10)

    // Create admin user
    const adminUser = new User({
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      status: 'active',
      timezone: 'UTC',
      interests: ['testing', 'development'],
      isOnboarded: true,
      subscription: {
        tier: 'monthly',
        sessionsUsed: 0,
        sessionsLimit: 9999, // Unlimited for testing
        startDate: new Date()
      }
    })

    await adminUser.save()

    console.log('✅ Admin user created successfully!')
    console.log('Email: admin@test.com')
    console.log('Password: Password123!')
    console.log('Role: admin')
    console.log('')
    console.log('You can now log in at http://localhost:3000/login')
    console.log('Admin dashboard: http://localhost:3000/admin')

    process.exit(0)
  } catch (error) {
    console.error('Error seeding admin user:', error)
    process.exit(1)
  }
}

seedAdmin()
