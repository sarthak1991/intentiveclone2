import { NextRequest, NextResponse } from 'next/server'
import { assertAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import AdminLog from '@/models/AdminLog'

/**
 * GET /api/admin/logs
 * Retrieve admin logs with filtering and pagination
 *
 * Query parameters:
 * - action: Filter by action type (optional)
 * - adminId: Filter by admin ID (optional)
 * - startDate: Filter by start date (ISO 8601, optional)
 * - endDate: Filter by end date (ISO 8601, optional)
 * - limit: Number of results per page (default: 50, max: 100)
 * - offset: Number of results to skip (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authorization
    const admin = await assertAdmin(request)

    await connectDB()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const adminId = searchParams.get('adminId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query filter
    const filter: any = {}

    if (action) {
      filter.action = action
    }

    if (adminId) {
      filter.adminId = adminId
    }

    if (startDate || endDate) {
      filter.createdAt = {}
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate)
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate)
      }
    }

    // Query logs with pagination
    const [logs, total] = await Promise.all([
      AdminLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      AdminLog.countDocuments(filter)
    ])

    // Calculate pagination
    const hasMore = offset + logs.length < total

    // Format logs for response
    const formattedLogs = logs.map((log) => ({
      id: log._id.toString(),
      adminId: log.adminId,
      adminName: log.adminName,
      action: log.action,
      targetUserId: log.targetUserId || null,
      targetRoomId: log.targetRoomId || null,
      reason: log.reason,
      metadata: log.metadata || {},
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString()
    }))

    return NextResponse.json({
      adminLogs: formattedLogs,
      total,
      limit,
      offset,
      hasMore
    })
  } catch (error: any) {
    // Handle authorization errors
    if (error.statusCode === 401 || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    // Handle other errors
    console.error('Error fetching admin logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin logs' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/logs/actions
 * Get list of available action types for filtering
 */
export async function OPTIONS() {
  const actions = [
    'user_blocked',
    'user_unblocked',
    'room_created',
    'room_updated',
    'room_cancelled',
    'captain_assigned',
    'captain_removed',
    'settings_updated',
    'announcement_sent',
    'view_logs'
  ]

  return NextResponse.json({
    actions
  })
}
