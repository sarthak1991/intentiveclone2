import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { IUser } from '@/models/types'

/**
 * Result of admin authorization check
 */
export interface AdminAuthResult {
  authorized: boolean
  user?: IUser
  error?: string
}

/**
 * Check if the current user is an admin
 * @returns AdminAuthResult with authorization status and user if authorized
 */
export async function requireAdmin(request: NextRequest): Promise<AdminAuthResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        authorized: false,
        error: 'Unauthorized: No session found'
      }
    }

    await connectDB()

    const user = await User.findById(session.user.id)

    if (!user) {
      return {
        authorized: false,
        error: 'Unauthorized: User not found'
      }
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      return {
        authorized: false,
        error: 'Forbidden: Admin access required'
      }
    }

    return {
      authorized: true,
      user
    }
  } catch (error) {
    console.error('Admin authorization error:', error)
    return {
      authorized: false,
      error: 'Internal server error during authorization check'
    }
  }
}

/**
 * Check if a user object has admin role
 * @param user - The user object
 * @returns True if user is an admin
 */
export function isAdmin(user: IUser | null): boolean {
  if (!user) return false
  return user.role === 'admin'
}

/**
 * Middleware-like function to use in API routes
 * Throws error if not admin, returns void if admin
 * @throws Error with 401 or 403 status code
 */
export async function assertAdmin(request: NextRequest): Promise<IUser> {
  const result = await requireAdmin(request)

  if (!result.authorized) {
    const statusCode = result.error?.includes('Unauthorized') ? 401 : 403
    const error = new Error(result.error || 'Authorization failed')
    ;(error as any).statusCode = statusCode
    throw error
  }

  return result.user!
}
