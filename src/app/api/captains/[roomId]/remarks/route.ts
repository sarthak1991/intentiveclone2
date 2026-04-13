import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { User } from '@/models/User'
import { CaptainAssignment } from '@/models/CaptainAssignment'

// Validation schema
const RemarksSchema = z.object({
  remarks: z.string().max(500, 'Remarks must be 500 characters or less'),
})

/**
 * POST /api/captains/[roomId]/remarks
 * Submit captain remarks for a session.
 * Captain only.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
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

    // 2. Parse and validate request body
    const body = await req.json()
    const { remarks } = RemarksSchema.parse(body)

    // 3. Connect to database
    await connectDB()

    const userId = session.user.id
    const { roomId } = await params

    // 4. Verify user is captain for this room
    const room = await Room.findById(roomId)
    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    const isCaptain =
      room.captainId?.toString() === userId ||
      (await CaptainAssignment.exists({
        userId,
        roomId,
        status: 'accepted',
      }))

    if (!isCaptain) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Captain privileges required' },
        { status: 403 }
      )
    }

    // 5. Update or create CaptainAssignment with remarks
    const assignment = await CaptainAssignment.findOneAndUpdate(
      { userId, roomId },
      { remarks },
      { upsert: true, new: true }
    )

    return NextResponse.json(
      {
        success: true,
        remarks,
        assignmentId: assignment._id.toString(),
      },
      { status: 200 }
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

    console.error('Error submitting captain remarks:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit remarks' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/captains/[roomId]/remarks
 * Get captain remarks for this room.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
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

    // 2. Connect to database
    await connectDB()

    const { roomId } = await params

    // 3. Find captain assignment with remarks
    const assignment = await CaptainAssignment.findOne({
      roomId,
      status: 'accepted',
      remarks: { $exists: true, $ne: null, $ne: '' },
    }).lean()

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'No remarks found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        remarks: assignment.remarks,
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
