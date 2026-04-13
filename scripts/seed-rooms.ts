/**
 * Seed script to create today's focus rooms
 */

import mongoose from 'mongoose'

async function seedRooms() {
  try {
    console.log('🌱 Starting rooms seed...')

    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/focusflow'
    await mongoose.connect(mongoUri)
    console.log('✅ Connected to database')

    // Define Room schema
    const roomSchema = new mongoose.Schema({
      scheduledTime: { type: Date, required: true },
      duration: { type: Number, default: 45 },
      capacity: { type: Number, default: 12 },
      participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      waitlist: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now }
      }],
      status: {
        type: String,
        enum: ['scheduled', 'open', 'full', 'in-progress', 'completed', 'cancelled'],
        default: 'scheduled'
      },
      tags: [{ type: String }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    })

    const Room = mongoose.model('Room', roomSchema)

    // Check if rooms already exist for today
    const now = new Date()
    const startOfDay = new Date(now)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const existingRooms = await Room.countDocuments({
      scheduledTime: { $gte: startOfDay, $lte: endOfDay }
    })

    if (existingRooms > 0) {
      console.log(`⚠️  ${existingRooms} rooms already exist for today, skipping...`)
      await mongoose.disconnect()
      return
    }

    // Create 8 rooms for today (9am - 4pm)
    const rooms = []
    const baseTime = new Date(now)
    baseTime.setHours(0, 0, 0, 0) // Start at midnight

    for (let hour = 9; hour <= 16; hour++) {
      const scheduledTime = new Date(baseTime)
      scheduledTime.setHours(hour, 0, 0, 0)

      const room = await Room.create({
        scheduledTime,
        duration: 45,
        capacity: 12,
        participants: [],
        waitlist: [],
        status: 'scheduled',
        tags: ['General', 'Focus'],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      rooms.push(room)
      console.log(`✅ Created room for ${hour}:00 - ${hour + 1}:00`)
    }

    console.log(`\n✨ Created ${rooms.length} rooms for today!`)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('👋 Disconnected from database')
  }
}

// Run seed
seedRooms()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
