import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

// Private API key - should match env variable
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'focusflow-admin-secret-2024'

// Validation schema
const CreateAdminSchema = z.object({
  apiKey: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  role: z.enum(['admin', 'moderator']).default('admin')
})

/**
 * POST /api/_admin/create-admin
 * Private API to create admin users
 * Requires valid API key in request body
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const result = CreateAdminSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: result.error.errors },
        { status: 400 }
      )
    }

    const { apiKey, email, password, name, role } = result.data

    // Verify API key
    if (apiKey !== ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      )
    }

    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create admin user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      role,
      isOnboarded: true, // Admins are considered onboarded
      sessionsRemaining: 9999, // Unlimited sessions
      subscriptionTier: 'monthly'
    })

    console.log(`[ADMIN API] Admin user created: ${email} (${role})`)

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })

  } catch (error: any) {
    console.error('[ADMIN API] Error creating admin:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user' },
      { status: 500 }
    )
  }
}
