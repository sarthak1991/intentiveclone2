import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/admin'
import { getBandwidthSummary } from '@/lib/bandwidth-tracker'
import { startOfDay, endOfDay, subDays } from 'date-fns'

/**
 * GET /api/admin/bandwidth
 * Admin-only endpoint to fetch bandwidth statistics
 * Query params:
 *   - startDate: ISO date string (default: 30 days ago)
 *   - endDate: ISO date string (default: today)
 *   - compare: "true" to include trends vs previous period
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authCheck = await assertAdmin(request)
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error || 'Unauthorized' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const compare = searchParams.get('compare') === 'true'

    // Default to past 30 days
    const endDate = endDateParam ? new Date(endDateParam) : new Date()
    const startDate = startDateParam
      ? new Date(startDateParam)
      : subDays(endDate, 30)

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO date string (e.g., 2026-04-01)' },
        { status: 400 }
      )
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'startDate must be before or equal to endDate' },
        { status: 400 }
      )
    }

    // Limit date range to prevent excessive queries
    const maxDays = 365
    const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    if (daysInRange > maxDays) {
      return NextResponse.json(
        { error: `Date range too large. Maximum ${maxDays} days allowed.` },
        { status: 400 }
      )
    }

    // Fetch bandwidth summary
    const data = await getBandwidthSummary(
      startOfDay(startDate),
      endOfDay(endDate),
      compare
    )

    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch bandwidth stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bandwidth statistics' },
      { status: 500 }
    )
  }
}
