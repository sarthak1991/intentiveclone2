import cron from 'node-cron'
import { connectDB } from '../src/lib/db'
import { Room } from '../src/models/Room'
import { addDays, startOfDay, setHours, setMinutes } from 'date-fns'

/**
 * Room Scheduler
 *
 * Creates daily focus rooms at midnight (Asia/Kolkata timezone).
 * Generates 8 rooms from 9am to 4pm (45-minute sessions).
 * Prevents duplicate room creation by checking existing rooms.
 */

const ROOM_START_HOUR = 9 // 9:00 AM
const ROOM_END_HOUR = 16  // 4:00 PM (inclusive)
const ROOM_CAPACITY = 12
const ROOM_DURATION = 45 // minutes
const SERVER_TIMEZONE = 'Asia/Kolkata'

/**
 * Create daily rooms for a specific date
 */
async function createDailyRooms(date: Date): Promise<void> {
  try {
    await connectDB()

    const today = startOfDay(date)
    const tomorrow = addDays(today, 1)

    // Check if rooms already exist for this date
    const existingRooms = await Room.countDocuments({
      scheduledTime: {
        $gte: today,
        $lt: tomorrow
      }
    })

    if (existingRooms > 0) {
      console.log(`[RoomScheduler] ${existingRooms} rooms already exist for ${today.toISOString().split('T')[0]}`)
      return
    }

    // Create 8 rooms (9am to 4pm)
    const roomsCreated = []

    for (let hour = ROOM_START_HOUR; hour <= ROOM_END_HOUR; hour++) {
      const scheduledTime = setMinutes(setHours(date, hour), 0)

      const room = await Room.create({
        title: 'Focus Room',
        scheduledTime,
        duration: ROOM_DURATION,
        capacity: ROOM_CAPACITY,
        status: 'scheduled',
        participants: [],
        waitlist: [],
        interestTags: [],
        isOverflowRoom: false
      })

      roomsCreated.push({
        id: room._id,
        time: scheduledTime.toISOString()
      })

      console.log(`[RoomScheduler] Created room: ${room._id} at ${scheduledTime.toISOString()}`)
    }

    console.log(`[RoomScheduler] Created ${roomsCreated.length} daily rooms for ${today.toISOString().split('T')[0]}`)

  } catch (error) {
    console.error('[RoomScheduler] Error creating daily rooms:', error)
    throw error
  }
}

/**
 * Start the room scheduler cron job
 *
 * Schedule: Runs daily at midnight (00:00)
 * Timezone: Asia/Kolkata (server timezone)
 */
export function startRoomScheduler(): cron.ScheduledTask {
  console.log('[RoomScheduler] Starting room scheduler...')

  // Schedule: 0 0 * * * (daily at midnight)
  const task = cron.schedule('0 0 * * *', async () => {
    console.log('[RoomScheduler] Running daily room creation task...')
    const now = new Date()
    await createDailyRooms(now)
  }, {
    timezone: SERVER_TIMEZONE
  })

  console.log('[RoomScheduler] Room scheduler started (runs daily at midnight)')
  return task
}

/**
 * Manually trigger room creation (for testing or admin use)
 */
export async function triggerRoomCreation(date: Date = new Date()): Promise<void> {
  console.log('[RoomScheduler] Manual room creation triggered')
  await createDailyRooms(date)
}

// Auto-start on import (for PM2/process manager)
if (require.main === module) {
  startRoomScheduler()
  console.log('[RoomScheduler] Running in standalone mode - press Ctrl+C to stop')
}
