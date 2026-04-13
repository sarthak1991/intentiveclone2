import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

/**
 * POST /api/subscription/subscribe
 * Subscribe to a tier (free or paid)
 * For testing: grantUnlimited flag bypasses actual payment
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tier, grantUnlimited = false } = body

    if (!['free', 'weekly', 'monthly'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Configure tier limits
    const tierConfig = {
      free: { sessionsLimit: 2 },
      weekly: { sessionsLimit: 8, priceInr: 249 },
      monthly: { sessionsLimit: 30, priceInr: 749 }
    }

    const config = tierConfig[tier as keyof typeof tierConfig]

    // For testing: grant unlimited sessions
    const sessionsLimit = grantUnlimited ? 9999 : config.sessionsLimit

    // Update user subscription
    user.subscription = {
      tier,
      sessionsUsed: 0,
      sessionsLimit,
      startDate: new Date(),
      // For paid tiers, next billing would be calculated based on plan
      nextBillingDate: tier === 'free' ? undefined : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }

    await user.save()

    return NextResponse.json({
      success: true,
      subscription: {
        tier,
        sessionsLimit,
        sessionsUsed: 0,
        sessionsRemaining: sessionsLimit
      }
    })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/subscription
 * Get current user's subscription status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const subscription = user.subscription || {
      tier: 'free',
      sessionsUsed: 0,
      sessionsLimit: 2
    }

    const sessionsRemaining = subscription.sessionsLimit - subscription.sessionsUsed

    return NextResponse.json({
      tier: subscription.tier,
      sessionsUsed: subscription.sessionsUsed || 0,
      sessionsLimit: subscription.sessionsLimit || 2,
      sessionsRemaining,
      nextBillingDate: subscription.nextBillingDate
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    )
  }
}
