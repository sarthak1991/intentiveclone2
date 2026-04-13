import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { Task } from '@/models/Task'
import { Room } from '@/models/Room'

// ============================================================================
// Validation Schema
// ============================================================================

const TaskUpdateSchema = z.object({
  taskText: z.string().min(1, 'Task cannot be empty').max(100, 'Task must be 100 characters or less').optional(),
  isCompleted: z.boolean().optional()
})

// ============================================================================
// GET /api/tasks/[id]
// Get a specific task by ID
// ============================================================================

export async function GET(
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

    // 2. Connect to database
    await connectDB()

    // 3. Find task by id
    const { id } = await params
    const task = await Task.findById(id)

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // 4. Verify userId matches session.user.id
    if (task.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 5. Return task
    return NextResponse.json(
      {
        success: true,
        taskId: task._id.toString(),
        taskText: task.taskText,
        submittedAt: task.submittedAt.toISOString(),
        isCompleted: task.isCompleted,
        completedAt: task.completedAt?.toISOString() || null,
        carriedOver: task.carriedOver
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/tasks/[id]
// Update a task (with 5-minute edit lock)
// ============================================================================

export async function PATCH(
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
    const updateData = TaskUpdateSchema.parse(body)

    // 3. Connect to database
    await connectDB()

    // 4. Find task by id
    const { id } = await params
    const task = await Task.findById(id)

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      )
    }

    // 5. Verify userId matches session.user.id
    if (task.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 6. Check edit lock: 5 minutes from submittedAt
    const editLockExpiry = new Date(task.submittedAt.getTime() + 5 * 60 * 1000)
    const now = new Date()

    if (now > editLockExpiry && updateData.taskText !== undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Edit window expired',
          message: 'Task can only be edited within 5 minutes of submission'
        },
        { status: 403 }
      )
    }

    // 7. Update task if provided
    if (updateData.taskText !== undefined) {
      task.taskText = updateData.taskText
    }

    // Allow completion status updates anytime
    if (updateData.isCompleted !== undefined) {
      const wasCompleted = task.isCompleted
      task.isCompleted = updateData.isCompleted

      // Set completedAt when transitioning to completed
      if (updateData.isCompleted && !wasCompleted) {
        task.completedAt = new Date()
      } else if (!updateData.isCompleted) {
        task.completedAt = undefined
      }
    }

    await task.save()

    // 8. Return updated task
    return NextResponse.json(
      {
        success: true,
        taskId: task._id.toString(),
        taskText: task.taskText,
        submittedAt: task.submittedAt.toISOString(),
        isCompleted: task.isCompleted,
        completedAt: task.completedAt?.toISOString() || null
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
    console.error('Error updating task:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
