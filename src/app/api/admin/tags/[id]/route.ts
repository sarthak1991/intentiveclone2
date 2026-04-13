import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import { InterestTag } from '@/models/InterestTag'
import { z } from 'zod'

// Zod schema for tag update
const UpdateTagSchema = z.object({
  name: z.string().min(1).max(50).trim().optional(),
  description: z.string().max(200).optional(),
  isActive: z.boolean().optional()
})

/**
 * PATCH /api/admin/tags/[id]
 * Update an interest tag (admin only)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(req)
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error?.includes('Unauthorized') ? 401 : 403 }
      )
    }

    await connectDB()

    const body = await req.json()
    const validationResult = UpdateTagSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { id } = await params
    const tag = await InterestTag.findById(id)

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    // If updating name, check for duplicates
    if (body.name && body.name !== tag.name) {
      const existingTag = await InterestTag.findOne({
        name: new RegExp(`^${body.name}$`, 'i'),
        _id: { $ne: id }
      })
      if (existingTag) {
        return NextResponse.json(
          { error: 'A tag with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update fields
    Object.assign(tag, validationResult.data)
    await tag.save()

    return NextResponse.json({
      success: true,
      tag,
      message: 'Tag updated successfully'
    })
  } catch (error) {
    console.error('Error updating tag:', error)

    // Handle duplicate key errors
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update tag' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/tags/[id]
 * Delete an interest tag (admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireAdmin(req)
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error?.includes('Unauthorized') ? 401 : 403 }
      )
    }

    await connectDB()

    const { id } = await params
    const tag = await InterestTag.findById(id)

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag not found' },
        { status: 404 }
      )
    }

    await InterestTag.deleteOne({ _id: id })

    return NextResponse.json({
      success: true,
      message: 'Tag deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting tag:', error)
    return NextResponse.json(
      { error: 'Failed to delete tag' },
      { status: 500 }
    )
  }
}
