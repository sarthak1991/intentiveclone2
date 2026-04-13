import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ isAdmin: false, error: 'Not authenticated' })
  }

  try {
    await connectDB()
    const user = await User.findById(session.user.id)

    if (!user) {
      return NextResponse.json({ isAdmin: false, error: 'User not found' })
    }

    return NextResponse.json({
      isAdmin: user.role === 'admin',
      role: user.role
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ isAdmin: false, error: 'Server error' })
  }
}
