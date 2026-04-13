import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Room } from '@/models/Room'
import { CaptainAssignment } from '@/models/CaptainAssignment'

// Validation schema
const CaptainAssignSchema = z.object({
  userId: z.string(),
  roomId: z.string(),
  isEmergency: z.boolean().optional(),
})

/**
 * POST /api/captains/assign
 * Assigns captain to specific room (emergency override allowed).
 * Requires admin role.
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

    // 2. Verify admin role
    const adminUser = await User.findById(session.user.id).select('role')
    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // 3. Parse and validate request body
    const body = await req.json()
    const { userId, roomId, isEmergency = false } = CaptainAssignSchema.parse(body)

    // 4. Connect to database
    await connectDB()

    // 5. Verify room exists
    const room = await Room.findById(roomId)
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    // 6. Verify user exists
    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // 7. Find or create CaptainAssignment with 'accepted' status (admin override)
    const assignment = await CaptainAssignment.findOneAndUpdate(
      { userId, roomId },
      {
        status: 'accepted',
        assignedBy: session.user.id,
        assignedAt: new Date(),
      },
      { upsert: true, new: true }
    )

    // 8. Update Room.captainId
    room.captainId = userId
    await room.save()

    // 9. Note: Socket.IO event would be emitted here to notify captain
    // This requires socket server integration

    // 10. Return response
    return NextResponse.json(
      {
        success: true,
        roomId: roomId,
        captainId: userId,
        isEmergency,
        message: isEmergency
          ? 'Emergency assignment completed'
          : 'Captain assigned successfully',
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

    console.error('Error assigning captain:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to assign captain' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/captains/assign
 * Returns all captain assignments for admin view.
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

    // 4. Get all assignments with populated fields
    const assignments = await CaptainAssignment.find()
      .populate('userId', 'name email photoUrl')
      .populate('roomId', 'title scheduledTime')
      .populate('assignedBy', 'name')
      .sort({ assignedAt: -1 })
      .lean()

    // 5. Format for response
    const formatted = assignments.map((assignment: any) => ({
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
      assignedBy: {
        id: assignment.assignedBy?._id?.toString(),
        name: assignment.assignedBy?.name,
      },
      status: assignment.status,
      assignedAt: assignment.assignedAt,
      sessionsCaptained: assignment.sessionsCaptained,
      freeSessionsEarned: assignment.freeSessionsEarned,
    }))

    return NextResponse.json(
      {
        success: true,
        assignments: formatted,
        total: formatted.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching captain assignments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
