import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Room } from '@/models/Room'
import { getTodaysRooms, enrichRoomsWithUserData } from '@/lib/rooms'
import { format, startOfDay, endOfDay } from 'date-fns'

/**
 * GET /api/rooms
 * Get rooms with user's timezone and registration status
 * Query params:
 *   - date: ISO date string to fetch rooms for specific date (optional)
 *   - startDate: ISO date string for date range start (optional)
 *   - endDate: ISO date string for date range end (optional)
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    // Get user with timezone
    const user = await User.findById(session.user.id)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Get query parameters for date filtering
    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    let rooms

    // If date range provided, fetch rooms for that range
    if (startDateParam && endDateParam) {
      const startDate = startOfDay(new Date(startDateParam))
      const endDate = endOfDay(new Date(endDateParam))

      rooms = await Room.find({
        scheduledTime: { $gte: startDate, $lte: endDate },
        status: { $ne: 'cancelled' }
      }).sort({ scheduledTime: 1 })
    } else if (dateParam) {
      // Fetch rooms for specific date
      const targetDate = startOfDay(new Date(dateParam))
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)

      rooms = await Room.find({
        scheduledTime: { $gte: targetDate, $lt: nextDay },
        status: { $ne: 'cancelled' }
      }).sort({ scheduledTime: 1 })
    } else {
      // Default: get today's rooms
      rooms = await getTodaysRooms()
    }

    // Enrich with user-specific data (display time, registration status)
    const enrichedRooms = await enrichRoomsWithUserData(rooms, user)

    return NextResponse.json({
      success: true,
      rooms: enrichedRooms,
      count: enrichedRooms.length
    })
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rooms' },
      { status: 500 }
    )
  }
}
