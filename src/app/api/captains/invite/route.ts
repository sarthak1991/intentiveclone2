import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { CaptainAssignment } from '@/models/CaptainAssignment'
import { Room } from '@/models/Room'

// Validation schema
const CaptainInviteSchema = z.object({
  userId: z.string(),
  roomId: z.string().optional(),
})

/**
 * POST /api/captains/invite
 * Sends captain invitation to eligible user.
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
    const { userId, roomId } = CaptainInviteSchema.parse(body)

    // 4. Connect to database
    await connectDB()

    // 5. Verify user exists
    const targetUser = await User.findById(userId)
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // 6. Check for existing invitation
    if (roomId) {
      const existingAssignment = await CaptainAssignment.findOne({
        userId,
        roomId,
        status: { $in: ['invited', 'accepted'] },
      })

      if (existingAssignment) {
        return NextResponse.json(
          {
            success: false,
            error: 'User already has a pending or active invitation for this room',
          },
          { status: 400 }
        )
      }
    } else {
      // General invitation - check if user has any pending invitations
      const pendingInvite = await CaptainAssignment.findOne({
        userId,
        status: 'invited',
      })

      if (pendingInvite) {
        return NextResponse.json(
          {
            success: false,
            error: 'User already has a pending invitation',
          },
          { status: 400 }
        )
      }
    }

    // 7. Create CaptainAssignment record
    const assignment = await CaptainAssignment.create({
      userId,
      roomId: roomId || null,
      assignedBy: session.user.id,
      status: 'invited',
      sessionsCaptained: 0,
      freeSessionsEarned: 0,
    })

    // 8. Note: Socket.IO event would be emitted here to notify user
    // This requires socket server integration, which would be added separately

    // 9. Return response
    return NextResponse.json(
      {
        success: true,
        invitationId: assignment._id.toString(),
        message: 'Invitation sent successfully',
      },
      { status: 201 }
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

    console.error('Error sending captain invitation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 }
    )
  }
}
