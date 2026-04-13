import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

/**
 * GET /api/users
 * Returns list of users (for admin dropdowns).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const adminUser = await User.findById(session.user.id).select('role')
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    await connectDB()

    const users = await User.find()
      .select('id name email')
      .sort({ name: 1 })
      .lean()

    return NextResponse.json({
      success: true,
      users: users.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
      })),
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
