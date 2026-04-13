import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Task } from '@/models/Task'
import { SessionCompletion } from '@/models/SessionCompletion'
import { Room } from '@/models/Room'

// ============================================================================
// Validation Schema
// ============================================================================

const TaskCompletionSchema = z.object({
  completed: z.boolean(),
  incompleteReason: z.string().optional(),
})

// ============================================================================
// POST /api/tasks/[id]/complete
// Mark a task as complete or incomplete
// ============================================================================

export async function POST(
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

    // 2. Parse and validate request body
    const body = await req.json()
    const { completed, incompleteReason } = TaskCompletionSchema.parse(body)

    // 3. Connect to database
    await connectDB()

    // 4. Find task and verify ownership
    const { id } = await params
    const task = await Task.findById(id)

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // Verify user owns this task
    if (task.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 5. Update task completion status
    task.isCompleted = completed
    task.completedAt = completed ? new Date() : null
    await task.save()

    // 6. Update or create SessionCompletion record
    const roomId = task.roomId.toString()

    let sessionCompletion = await SessionCompletion.findOne({
      userId: session.user.id,
      roomId,
    })

    if (sessionCompletion) {
      // Update existing record
      sessionCompletion.completed = completed
      sessionCompletion.taskCompletedAt = completed ? new Date() : null
      if (incompleteReason && !completed) {
        sessionCompletion.incompleteReason = incompleteReason
      }
      await sessionCompletion.save()
    } else {
      // Create new record
      sessionCompletion = await SessionCompletion.create({
        userId: session.user.id,
        roomId,
        completed,
        taskCompletedAt: completed ? new Date() : null,
        incompleteReason: incompleteReason,
      })
    }

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        completed,
        taskId: task._id.toString(),
        taskCompletedAt: task.completedAt?.toISOString() || null,
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

    // Handle other errors
    console.error('Error updating task completion:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task completion' },
      { status: 500 }
    )
  }
}
