import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()

    await connectDB()

    await User.findByIdAndUpdate(session.user.id, {
      name: data.name,
      photoId: data.photoId,
      photoUrl: data.photoUrl,
      timezone: data.timezone,
      interests: data.interests,
      isOnboarded: true
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding save error:', error)
    return NextResponse.json({ error: 'Failed to save onboarding data' }, { status: 500 })
  }
}
