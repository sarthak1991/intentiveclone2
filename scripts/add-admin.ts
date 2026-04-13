import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { connectDB } from '../src/lib/db'
import { User } from '../src/models/User'

async function addAdmin() {
  try {
    await connectDB()

    const email = 'demo@test.com'
    const password = 'Demo123!'

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      console.log('User already exists:', existingUser.email)
      console.log('Deleting existing user...')
      await User.deleteOne({ email })
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create admin user
    const adminUser = new User({
      email,
      password: hashedPassword,
      name: 'Demo Admin',
      role: 'admin',
      status: 'active',
      timezone: 'UTC',
      interests: ['testing', 'development'],
      isOnboarded: true,
      subscription: {
        tier: 'monthly',
        sessionsUsed: 0,
        sessionsLimit: 9999,
        startDate: new Date()
      }
    })

    await adminUser.save()

    console.log('✅ Admin user created successfully!')
    console.log('Email:', email)
    console.log('Password:', password)
    console.log('Role: admin')
    console.log('')
    console.log('You can now log in at http://localhost:3000/login')

    process.exit(0)
  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  }
}

addAdmin()
