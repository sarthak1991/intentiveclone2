import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Room } from '@/models/Room'
import { CaptainAssignment } from '@/models/CaptainAssignment'

// Validation schema
const AdminAssignmentSchema = z.object({
  roomId: z.string(),
  userId: z.string(),
  isEmergency: z.boolean().optional(),
})

/**
 * POST /api/admin/captains/assign
 * Admin assigns captain to specific room with emergency override.
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
    const { roomId, userId, isEmergency = false } = AdminAssignmentSchema.parse(body)

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

    // 7. Find or create CaptainAssignment
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

    // 9. Return response
    return NextResponse.json(
      {
        success: true,
        assignmentId: assignment._id.toString(),
        roomId,
        captainId: userId,
        isEmergency,
      },
      { status: isEmergency ? 201 : 200 }
    )
  } catch (error) {
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
 * DELETE /api/admin/captains/assign/[id]
 * Remove captain assignment.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 4. Delete assignment
    const { id } = await params
    const assignment = await CaptainAssignment.findByIdAndDelete(id)

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // 5. Clear room.captainId if this was the assigned captain
    await Room.findByIdAndUpdate(assignment.roomId, {
      captainId: null,
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Captain assignment removed',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing captain assignment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove assignment' },
      { status: 500 }
    )
  }
}
