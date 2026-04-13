import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { CaptainAssignment } from '@/models/CaptainAssignment'

/**
 * GET /api/admin/captains/remarks
 * Returns all captain remarks for admin review.
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

    // 4. Find all assignments with remarks
    const assignments = await CaptainAssignment.find({
      remarks: { $exists: true, $ne: null, $ne: '' },
    })
      .populate('userId', 'name email photoUrl')
      .populate('roomId', 'title scheduledTime')
      .populate('assignedBy', 'name')
      .sort({ assignedAt: -1 })
      .lean()

    // 5. Format remarks
    const remarks = assignments.map((assignment: any) => ({
      id: assignment._id.toString(),
      captain: {
        id: assignment.userId?._id?.toString(),
        name: assignment.userId?.name,
        email: assignment.userId?.email,
        photoUrl: assignment.userId?.photoUrl,
      },
      room: assignment.roomId
        ? {
            id: assignment.roomId._id.toString(),
            title: assignment.roomId.title,
            scheduledTime: assignment.roomId.scheduledTime,
          }
        : null,
      remarks: assignment.remarks,
      assignedAt: assignment.assignedAt,
    }))

    return NextResponse.json(
      {
        success: true,
        remarks,
        total: remarks.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching captain remarks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch remarks' },
      { status: 500 }
    )
  }
}
