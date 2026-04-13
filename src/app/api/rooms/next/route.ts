import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'

/**
 * GET /api/rooms/next
 * Returns next available rooms with 15+ minute gap.
 * Used for suggesting next room after session completion.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Connect to database
    await connectDB()

    // 3. Get current time + 15 minutes (per TASK-05: 15+ minute gap)
    const fifteenMinutesFromNow = new Date(Date.now() + 15 * 60 * 1000)

    // 4. Query for upcoming rooms
    const upcomingRooms = await Room.find({
      scheduledTime: { $gte: fifteenMinutesFromNow },
      status: { $in: ['scheduled', 'open'] },
    })
      .sort({ scheduledTime: 1 }) // Ascending order
      .limit(3)
      .lean()

    // 5. Add participant counts for each room
    const roomPromises = upcomingRooms.map(async (room) => {
      const participantCount = await Registration.countDocuments({
        roomId: room._id,
        status: 'registered',
      })

      return {
        id: room._id.toString(),
        title: room.title,
        scheduledTime: room.scheduledTime.toISOString(),
        capacity: room.capacity,
        participantCount,
        spotsAvailable: room.capacity - participantCount,
      }
    })

    const rooms = await Promise.all(roomPromises)

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        rooms,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching next rooms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch next rooms' },
      { status: 500 }
    )
  }
}
