import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { CaptainAssignment } from '@/models/CaptainAssignment'

/**
 * GET /api/captains/rewards
 * Returns captain reward status and progress.
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

    const userId = session.user.id

    // 3. Find all captain assignments for this user
    const assignments = await CaptainAssignment.find({
      userId,
      status: { $in: ['invited', 'accepted'] },
    })

    // 4. Calculate totals
    const sessionsCaptained = assignments.reduce((sum, a) => sum + (a.sessionsCaptained || 0), 0)
    const freeSessionsEarned = Math.floor(sessionsCaptained / 4)

    // 5. Calculate progress toward next free session
    const progress = sessionsCaptained % 4
    const untilFreeSession = 4 - progress

    // 6. Check today's captain sessions (daily limit: max 2 per day per CAPT-07)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaySessionCount = await CaptainAssignment.countDocuments({
      userId,
      assignedAt: { $gte: today, $lt: tomorrow },
      status: 'accepted',
    })

    const canCaptainToday = todaySessionCount < 2

    // 7. Return response
    return NextResponse.json(
      {
        success: true,
        sessionsCaptained,
        freeSessionsEarned,
        progress, // 0-3 (4 completes a cycle)
        untilFreeSession, // 1-4 (sessions until next free session)
        todaySessionCount,
        canCaptainToday,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching captain rewards:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rewards' },
      { status: 500 }
    )
  }
}
