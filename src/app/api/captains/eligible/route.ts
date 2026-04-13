import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { SessionCompletion } from '@/models/SessionCompletion'
import { CaptainAssignment } from '@/models/CaptainAssignment'

/**
 * GET /api/captains/eligible
 * Returns users eligible for captain role (4+ completed sessions).
 * Requires admin role.
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

    // 2. Verify admin role
    const adminUser = await User.findById(session.user.id).select('role')
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // 3. Connect to database
    await connectDB()

    // 4. Aggregation pipeline to find eligible users
    // Eligibility: 4+ completed sessions (per CAPT-01)
    const eligibleUsers = await SessionCompletion.aggregate([
      // Match completed sessions
      {
        $match: {
          completed: true,
          attendedAt: { $exists: true },
        },
      },
      // Group by userId and count completions
      {
        $group: {
          _id: '$userId',
          completedCount: { $sum: 1 },
        },
      },
      // Filter for 4+ completed sessions
      {
        $match: {
          completedCount: { $gte: 4 },
        },
      },
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      // Unwind user array
      {
        $unwind: '$user',
      },
      // Project final shape
      {
        $project: {
          _id: '$_id',
          userId: '$_id',
          name: '$user.name',
          email: '$user.email',
          photoUrl: '$user.photoUrl',
          completedCount: 1,
        },
      },
    ])

    // 5. Filter out existing captains (users with pending/active invitations)
    const existingCaptainUserIds = await CaptainAssignment.distinct('userId', {
      status: { $in: ['invited', 'accepted'] },
    })

    const availableUsers = eligibleUsers.filter(
      (user) => !existingCaptainUserIds.includes(user._id.toString())
    )

    // 6. Return response
    return NextResponse.json(
      {
        success: true,
        eligible: availableUsers,
        total: availableUsers.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching eligible captains:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch eligible captains' },
      { status: 500 }
    )
  }
}
