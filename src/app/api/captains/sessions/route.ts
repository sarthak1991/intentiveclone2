import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { CaptainAssignment } from '@/models/CaptainAssignment'

// Validation schema
const CaptainSessionSchema = z.object({
  roomId: z.string(),
})

/**
 * POST /api/captains/sessions
 * Increments captain session count after captaining a session.
 * Enforces daily limit of max 2 sessions per day.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await req.json()
    const { roomId } = CaptainSessionSchema.parse(body)

    // 3. Connect to database
    await connectDB()

    const userId = session.user.id

    // 4. Verify user is captain for this room
    const room = await Room.findById(roomId)
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    if (room.captainId?.toString() !== userId) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You are not the captain for this room' },
        { status: 403 }
      )
    }

    // 5. Check daily limit (max 2 per day per CAPT-07)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaySessionCount = await CaptainAssignment.countDocuments({
      userId,
      assignedAt: { $gte: today, $lt: tomorrow },
      status: 'accepted',
    })

    if (todaySessionCount >= 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Daily limit reached: Maximum 2 captain sessions per day',
        },
        { status: 403 }
      )
    }

    // 6. Find or create CaptainAssignment and increment count
    const assignment = await CaptainAssignment.findOneAndUpdate(
      { userId, roomId },
      {
        $inc: { sessionsCaptained: 1 },
        lastCaptainSessionDate: new Date(),
      },
      { upsert: true, new: true }
    )

    // 7. Check if user earned a free session (every 4 sessions)
    const totalSessions = (assignment?.sessionsCaptained || 0) + 1
    const earnedFreeSession = totalSessions % 4 === 0

    if (earnedFreeSession) {
      await CaptainAssignment.updateOne(
        { userId, roomId },
        { $inc: { freeSessionsEarned: 1 } }
      )
    }

    // 8. Return updated reward info
    return NextResponse.json(
      {
        success: true,
        sessionsCaptained: totalSessions,
        freeSessionsEarned: earnedFreeSession
          ? Math.floor(totalSessions / 4)
          : Math.floor(totalSessions / 4),
        progress: totalSessions % 4,
        untilFreeSession: 4 - (totalSessions % 4),
        todaySessionCount: todaySessionCount + 1,
        canCaptainToday: todaySessionCount + 1 < 2,
      },
      { status: 200 }
    )
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request format',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    console.error('Error incrementing captain session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to increment session count' },
      { status: 500 }
    )
  }
}
