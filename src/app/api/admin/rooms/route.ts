import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { z } from 'zod'

// Zod schema for room creation
const CreateRoomSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  scheduledTime: z.string().datetime(),
  duration: z.number().min(15).max(120).optional(),
  capacity: z.number().min(1).max(12).optional(),
  interestTags: z.array(z.string().trim()).optional()
})

/**
 * POST /api/admin/rooms
 * Create a new room (admin only)
 */
export async function POST(req: NextRequest) {
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
    const validationResult = CreateRoomSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { scheduledTime, duration, capacity, interestTags, title } = validationResult.data

    // Convert scheduledTime to Date
    const scheduledDate = new Date(scheduledTime)

    // Create room
    const room = await Room.create({
      title: title || 'Focus Room',
      scheduledTime: scheduledDate,
      duration: duration || 45,
      capacity: capacity || 12,
      interestTags: interestTags || [],
      status: 'scheduled'
    })

    return NextResponse.json({
      success: true,
      room,
      message: 'Room created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)

    // Handle duplicate key errors (e.g., same scheduled time)
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'A room already exists at this time' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    )
  }
}
