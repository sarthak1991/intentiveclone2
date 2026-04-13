import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { CaptainAssignment } from '@/models/CaptainAssignment'

/**
 * GET /api/rooms/[roomId]/captain-status
 * Returns whether current user is captain for the given room.
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

    const userId = session.user.id
    const { roomId } = await params

    // 3. Check if user is captain via room.captainId or CaptainAssignment
    const room = await Room.findById(roomId)

    if (!room) {
      return NextResponse.json(
        { success: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check direct assignment
    const isCaptainViaRoom = room.captainId?.toString() === userId

    // Check via CaptainAssignment
    const assignment = await CaptainAssignment.findOne({
      userId,
      roomId,
      status: 'accepted',
    })

    const isCaptain = isCaptainViaRoom || !!assignment

    // 4. Return response
    return NextResponse.json(
      {
        success: true,
        isCaptain,
        captainId: isCaptainViaRoom ? room.captainId?.toString() : null,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching captain status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch captain status' },
      { status: 500 }
    )
  }
}
