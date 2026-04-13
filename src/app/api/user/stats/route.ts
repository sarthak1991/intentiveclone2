import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { SessionCompletion } from '@/models/SessionCompletion'
import { Registration } from '@/models/Registration'
import { Streak } from '@/models/Streak'
import { calculateStreak } from '@/lib/streak'

/**
 * GET /api/user/stats
 * Returns current user's attendance and completion statistics.
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

    // 3. Calculate total sessions (attended + no-show)
    const totalSessions = await Registration.countDocuments({
      userId,
      status: { $in: ['attended', 'no-show'] },
    })

    // 4. Calculate completed tasks
    const completedTasks = await SessionCompletion.countDocuments({
      userId,
      completed: true,
    })

    // 5. Calculate completion rate
    const completionRate =
      totalSessions > 0
        ? ((completedTasks / totalSessions) * 100).toFixed(1)
        : '0.0'

    // 6. Get streak info
    const streakRecord = await Streak.findOne({ userId })
    const currentStreak = streakRecord?.currentStreak || 0
    const longestStreak = streakRecord?.longestStreak || 0

    // 7. Return response
    return NextResponse.json(
      {
        success: true,
        totalSessions,
        completedTasks,
        completionRate: parseFloat(completionRate),
        currentStreak,
        longestStreak,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
