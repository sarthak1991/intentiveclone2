import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { registerForRoom, cancelRegistration, getRegistrationStatus } from '@/lib/rooms'

/**
 * POST /api/rooms/[id]/register
 * Register user for a room
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const userId = session.user.id

    // Check if room exists
    const room = await Room.findById(roomId)
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      )
    }

    // Check registration window
    const status = getRegistrationStatus(room)
    if (!status.canRegister) {
      return NextResponse.json(
        { error: status.message },
        { status: 400 }
      )
    }

    // Register user (atomic operation)
    const updatedRoom = await registerForRoom(roomId, userId)

    return NextResponse.json({
      success: true,
      message: 'Registered successfully',
      room: updatedRoom
    }, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle specific error messages
    const errorMessage = error.message || 'Registration failed'
    const statusCode = errorMessage.includes('full') ? 400 : 500

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

/**
 * DELETE /api/rooms/[id]/register
 * Cancel user's registration for a room
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const userId = session.user.id

    // Cancel registration
    const updatedRoom = await cancelRegistration(roomId, userId)

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled successfully',
      room: updatedRoom
    })
  } catch (error: any) {
    console.error('Cancellation error:', error)

    const errorMessage = error.message || 'Cancellation failed'
    const statusCode = errorMessage.includes('not found') ? 404 : 500

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
