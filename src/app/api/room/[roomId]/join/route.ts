import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { getParticipants } from '@/server/presence'

// ============================================================================
// GET /api/room/[roomId]/join
// Check if user can join room and return room info
// ============================================================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    // 1. Authentication - Require NextAuth session token
    const session = await getServerSession()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { canJoin: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { roomId } = await params

    // 2. Connect to database
    await connectDB()

    // 3. Get room details
    const room = await Room.findById(roomId)

    if (!room) {
      return NextResponse.json(
        { canJoin: false, error: 'Room not found' },
        { status: 404 }
      )
    }

    // 4. Get current participant count from presence tracking
    const currentParticipants = getParticipants(roomId)
    const participantCount = currentParticipants.length

    // 5. Check if room has capacity
    if (participantCount < room.capacity) {
      // Room has capacity - return main room info
      return NextResponse.json({
        canJoin: true,
        roomId: roomId,
        roomName: room.title,
        isOverflow: false,
        capacity: room.capacity,
        currentParticipants: participantCount,
        status: room.status
      })
    }

    // 6. Room is full - check for overflow room
    if (room.isOverflowRoom) {
      // This is an overflow room and it's full
      return NextResponse.json({
        canJoin: false,
        error: 'Room is full',
        roomId: roomId,
        roomName: room.title,
        isOverflow: true,
        capacity: room.capacity,
        currentParticipants: participantCount
      })
    }

    // 7. Main room is full - check if overflow room exists
    let overflowRoom = await Room.findById(room.overflowRoomId)

    if (!overflowRoom) {
      // No overflow room exists yet - this is an edge case
      // Normally overflow room is created in socket-server.ts
      // Return main room info and let socket handler create overflow
      return NextResponse.json({
        canJoin: true,
        roomId: roomId,
        roomName: room.title,
        isOverflow: false,
        capacity: room.capacity,
        currentParticipants: participantCount,
        status: room.status,
        note: 'Room is at capacity. You may be redirected to overflow room.'
      })
    }

    // 8. Check overflow room capacity
    const overflowParticipants = getParticipants(overflowRoom._id.toString())
    const overflowCount = overflowParticipants.length

    if (overflowCount >= overflowRoom.capacity) {
      // Overflow room is also full
      return NextResponse.json({
        canJoin: false,
        error: 'Room is full',
        roomId: roomId,
        roomName: room.title,
        isOverflow: false,
        capacity: room.capacity,
        currentParticipants: participantCount,
        overflowRoomId: overflowRoom._id.toString(),
        overflowRoomName: overflowRoom.title,
        overflowCapacity: overflowRoom.capacity,
        overflowCurrentParticipants: overflowCount
      })
    }

    // 9. Return overflow room info for redirection
    return NextResponse.json({
      canJoin: true,
      roomId: overflowRoom._id.toString(),
      roomName: overflowRoom.title,
      isOverflow: true,
      capacity: overflowRoom.capacity,
      currentParticipants: overflowCount,
      status: overflowRoom.status,
      originalRoomId: roomId,
      originalRoomName: room.title,
      message: 'This room is full. You\'ll be moved to the overflow room.'
    })
  } catch (error) {
    console.error('Error checking room join:', error)
    return NextResponse.json(
      { canJoin: false, error: 'Failed to check room availability' },
      { status: 500 }
    )
  }
}
