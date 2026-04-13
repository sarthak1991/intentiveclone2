import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Registration } from '@/models/Registration'
import { Streak } from '@/models/Streak'
import AdminLog from '@/models/AdminLog'

type Action = 'ban' | 'suspend' | 'unsuspend' | 'unban'
type Duration = '1day' | '1week' | '1month' | 'permanent'

interface UserStats {
  sessionsAttended: number
  noShowCount: number
  totalRegistrations: number
  noShowRate: number
  currentStreak: number
}

/**
 * GET /api/admin/users/[userId]
 * Fetch user details with statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await assertAdmin(request)

    const { userId } = await params

    await connectDB()

    const user = await User.findById(userId).select('-password').lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Calculate user statistics
    const stats = await getUserStats(userId)

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
        photoUrl: user.photoUrl,
        timezone: user.timezone,
        interests: user.interests,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        banReason: user.banReason,
        banExpiresAt: user.banExpiresAt,
        ...stats
      }
    })
  } catch (error: any) {
    console.error('Error fetching user:', error)

    if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/users/[userId]
 * Update user status (ban, suspend, unsuspend, unban)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await assertAdmin(request)

    const { userId } = await params
    const body = await request.json()
    const { action, reason, duration }: { action: Action; reason: string; duration?: Duration } = body

    // Validate required fields
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 10) {
      return NextResponse.json(
        { error: 'Reason is required and must be at least 10 characters' },
        { status: 400 }
      )
    }

    // Validate action
    const validActions: Action[] = ['ban', 'suspend', 'unsuspend', 'unban']
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be one of: ban, suspend, unsuspend, unban' },
        { status: 400 }
      )
    }

    await connectDB()

    const user = await User.findById(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prevent admins from banning themselves
    if (user._id.toString() === admin._id.toString()) {
      return NextResponse.json(
        { error: 'Cannot modify your own account status' },
        { status: 400 }
      )
    }

    // Calculate ban expiration if duration is provided
    let banExpiresAt: Date | null = null

    if (action === 'ban' || action === 'suspend') {
      if (!duration) {
        return NextResponse.json(
          { error: 'Duration is required for ban/suspend actions' },
          { status: 400 }
        )
      }

      if (duration !== 'permanent') {
        const now = new Date()
        switch (duration) {
          case '1day':
            banExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            break
          case '1week':
            banExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
            break
          case '1month':
            banExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            break
          case 'permanent':
            banExpiresAt = null
            break
        }
      }
    }

    // Update user status based on action
    const previousStatus = user.status
    let actionLog: string = action

    switch (action) {
      case 'ban':
        user.status = 'banned'
        user.banReason = reason.trim()
        user.banExpiresAt = banExpiresAt
        break

      case 'suspend':
        user.status = 'suspended'
        user.banReason = reason.trim()
        user.banExpiresAt = banExpiresAt
        break

      case 'unsuspend':
      case 'unban':
        user.status = 'active'
        user.banReason = undefined
        user.banExpiresAt = undefined
        break
    }

    await user.save()

    // Create admin log entry
    await AdminLog.create({
      adminId: admin._id.toString(),
      adminName: admin.name,
      action: `user_${action}`,
      targetUserId: user._id.toString(),
      reason: reason.trim(),
      metadata: {
        previousStatus,
        newStatus: user.status,
        duration: duration || null,
        banExpiresAt: user.banExpiresAt
      }
    })

    // Get updated stats
    const stats = await getUserStats(userId)

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
        photoUrl: user.photoUrl,
        timezone: user.timezone,
        interests: user.interests,
        isOnboarded: user.isOnboarded,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        banReason: user.banReason,
        banExpiresAt: user.banExpiresAt,
        ...stats
      }
    })
  } catch (error: any) {
    console.error('Error updating user:', error)

    if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (error.message?.includes('Forbidden') || error.message?.includes('403')) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to calculate user statistics
 */
async function getUserStats(userId: string): Promise<UserStats> {
  try {
    // Count sessions attended and no-shows
    const registrations = await Registration.find({ userId }).lean()

    const sessionsAttended = registrations.filter(r => r.status === 'attended').length
    const noShowCount = registrations.filter(r => r.status === 'no-show').length
    const totalRegistrations = registrations.length
    const noShowRate = totalRegistrations > 0
      ? Math.round((noShowCount / totalRegistrations) * 100)
      : 0

    // Get current streak
    const streak = await Streak.findOne({ userId }).lean()
    const currentStreak = streak?.currentStreak || 0

    return {
      sessionsAttended,
      noShowCount,
      totalRegistrations,
      noShowRate,
      currentStreak
    }
  } catch (error) {
    console.error('Error calculating user stats:', error)
    return {
      sessionsAttended: 0,
      noShowCount: 0,
      totalRegistrations: 0,
      noShowRate: 0,
      currentStreak: 0
    }
  }
}
