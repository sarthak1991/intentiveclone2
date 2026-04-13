import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { calculateStreak } from '@/lib/streak'

/**
 * GET /api/streak
 * Returns current user's streak information.
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

    // 3. Get user's timezone
    const user = await User.findById(session.user.id).select('timezone')
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // 4. Calculate streak
    const streakInfo = await calculateStreak(
      session.user.id,
      user.timezone
    )

    // 5. Return response
    return NextResponse.json(
      {
        success: true,
        ...streakInfo,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching streak:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch streak' },
      { status: 500 }
    )
  }
}
