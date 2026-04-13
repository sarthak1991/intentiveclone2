import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import { InterestTag } from '@/models/InterestTag'
import { z } from 'zod'

// Zod schema for tag creation/update
const TagSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  description: z.string().max(200).optional(),
  isActive: z.boolean().optional()
})

/**
 * GET /api/admin/tags
 * List all interest tags (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireAdmin(req)
    if (!authCheck.authorized) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.error?.includes('Unauthorized') ? 401 : 403 }
      )
    }

    await connectDB()

    const tags = await InterestTag.find().sort({ name: 1 })

    return NextResponse.json({
      success: true,
      tags
    })
  } catch (error) {
    console.error('Error fetching tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/tags
 * Create a new interest tag (admin only)
 */
export async function POST(req: NextRequest) {
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
    const validationResult = TagSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { name, description, isActive } = validationResult.data

    // Check if tag already exists
    const existingTag = await InterestTag.findOne({ name: new RegExp(`^${name}$`, 'i') })
    if (existingTag) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 400 }
      )
    }

    const tag = await InterestTag.create({
      name,
      description,
      isActive: isActive ?? true
    })

    return NextResponse.json({
      success: true,
      tag,
      message: 'Tag created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)

    // Handle duplicate key errors
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      return NextResponse.json(
        { error: 'A tag with this name already exists' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}
