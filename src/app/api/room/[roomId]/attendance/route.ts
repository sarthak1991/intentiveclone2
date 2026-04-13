import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'

// ============================================================================
// Validation Schema
// ============================================================================

const AttendanceConfirmationSchema = z.object({
  userId: z.string(),
  sessionId: z.string()
})

// ============================================================================
// POST /api/room/[roomId]/attendance
// Confirm attendance for user in session
// ============================================================================

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    // 1. Authentication - Require NextAuth session token
    const session = await getServerSession()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await req.json()
    const { userId, sessionId } = AttendanceConfirmationSchema.parse(body)

    // 3. Verify user matches authenticated session
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'User ID mismatch' },
        { status: 403 }
      )
    }

    // 4. Connect to database
    await connectDB()

    // 5. Find registration for this user + session
    const registration = await Registration.findOne({
      user: userId,
      room: sessionId
    })

    if (!registration) {
      return NextResponse.json(
        { success: false, error: 'Registration not found' },
        { status: 404 }
      )
    }

    // 6. Check if already attended (prevent duplicate records)
    if (registration.attended) {
      return NextResponse.json(
        {
          success: true,
          attended: true,
          message: 'Attendance already confirmed'
        },
        { status: 200 }
      )
    }

    // 7. Update attendance record
    registration.attended = true
    registration.attendedAt = new Date()
    await registration.save()

    // 8. Return success response
    return NextResponse.json(
      {
        success: true,
        attended: true,
        attendedAt: registration.attendedAt.toISOString()
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
          details: error.errors
        },
        { status: 400 }
      )
    }

    // Handle other errors
    console.error('Error confirming attendance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to confirm attendance' },
      { status: 500 }
    )
  }
}
