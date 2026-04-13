import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'
import { SessionCompletion } from '@/models/SessionCompletion'
import { format } from 'date-fns'

/**
 * GET /api/user/history
 * Returns current user's past 7 sessions with status icons.
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

    // 3. Get last 7 registrations for user
    const registrations = await Registration.find({
      userId: session.user.id,
      status: { $in: ['attended', 'no-show'] },
    })
      .sort({ registeredAt: -1 }) // Most recent first
      .limit(7)
      .populate('roomId')
      .lean()

    // 4. Fetch session completion status for each
    const sessions = await Promise.all(
      registrations.map(async (reg) => {
        const room = reg.roomId as any
        const completion = await SessionCompletion.findOne({
          userId: session.user.id,
          roomId: room._id,
        })

        return {
          id: room._id.toString(),
          roomTitle: room.title,
          scheduledTime: room.scheduledTime,
          status: reg.status,
          taskCompleted: completion?.completed || false,
        }
      })
    )

    // 5. Return response
    return NextResponse.json(
      {
        success: true,
        sessions,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user history:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    )
  }
}
