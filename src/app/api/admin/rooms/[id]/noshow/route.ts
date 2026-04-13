import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import { Registration } from '@/models/Registration'
import { recordNoShow } from '@/lib/rooms'
import { z } from 'zod'

// Zod schema for no-show marking
const NoShowSchema = z.object({
  userId: z.string().min(1),
  remarks: z.string().trim().optional()
})

/**
 * POST /api/admin/rooms/[id]/noshow
 * Record a user as no-show and reassign their slot (admin only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authorization
    const authCheck = await requireAdmin(req)
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error?.includes('Unauthorized') ? 401 : 403 }
      )
    }

    await connectDB()

    // Parse and validate request body
    const body = await req.json()
    const validationResult = NoShowSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { userId, remarks } = validationResult.data
    const { id: roomId } = await params

    // Check if registration exists
    const registration = await Registration.findOne({
      userId,
      roomId,
      status: 'registered'
    })

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    // Record no-show and reassign slot
    const { room, promotedUser } = await recordNoShow(roomId, userId, remarks)

    const response: any = {
      success: true,
      message: 'No-show recorded successfully',
      room
    }

    // Include promoted user info if someone was promoted from waitlist
    if (promotedUser) {
      response.promotedUser = {
        id: promotedUser._id,
        name: promotedUser.name,
        email: promotedUser.email
      }
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error recording no-show:', error)

    const errorMessage = error.message || 'Failed to record no-show'
    const statusCode = errorMessage.includes('not found') ? 404 : 500

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}
