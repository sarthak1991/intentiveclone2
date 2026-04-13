import { startOfDay, endOfDay, subDays } from 'date-fns'
import { BandwidthStats, IBandwidthStats } from '@/models/BandwidthStats'

/**
 * Bandwidth tracking event
 */
export interface BandwidthEvent {
  roomId: string
  bytesRelayed: number
  bytesDirect: number
  transportCount?: number  // Increment if new transport
  participantMinutes?: number  // Add to total
}

/**
 * Daily bandwidth statistics
 */
export interface DailyBandwidthStats {
  date: Date
  totalBytesRelayed: number
  totalBytesDirect: number
  totalCost: number
  roomCount: number
  relayVsDirectRatio: number
}

/**
 * Room bandwidth breakdown
 */
export interface RoomBandwidth {
  roomId: string
  bytesRelayed: number
  bytesDirect: number
  cost: number
  sessionCount: number
}

/**
 * Bandwidth statistics summary
 */
export interface BandwidthStatsSummary {
  summary: {
    totalBytesRelayed: number
    totalBytesDirect: number
    totalCost: number
    relayVsDirectRatio: number
    totalGB: number
  }
  daily: Array<{
    date: string
    bytesRelayed: number
    bytesDirect: number
    cost: number
    roomCount: number
  }>
  roomBreakdown: RoomBandwidth[]
  trends?: {
    costChange: number
    usageChange: number
  }
}

// Cost per GB of relayed bandwidth (configurable via env var)
const TURN_COST_PER_GB = parseFloat(process.env.TURN_COST_PER_GB || '0.01')

/**
 * Calculate cost from relayed bytes
 * @param bytesRelayed - Number of relayed bytes
 * @returns Estimated cost in USD
 */
export function calculateCost(bytesRelayed: number): number {
  const gb = bytesRelayed / (1024 * 1024 * 1024)
  return gb * TURN_COST_PER_GB
}

/**
 * Track bandwidth usage for a room
 * Creates or updates BandwidthStats document for today + roomId
 * @param event - Bandwidth event data
 */
export async function trackBandwidth(event: BandwidthEvent): Promise<void> {
  const today = startOfDay(new Date())
  const roomId = event.roomId

  try {
    // Find or create stats document
    let stats = await BandwidthStats.findOne({ date: today, roomId })

    if (!stats) {
      stats = new BandwidthStats({
        date: today,
        roomId,
        bytesRelayed: 0,
        bytesDirect: 0,
        transportCount: 0,
        participantMinutes: 0,
        estimatedCost: 0,
        relayVsDirectRatio: 0
      })
    }

    // Update byte counts
    stats.bytesRelayed += event.bytesRelayed
    stats.bytesDirect += event.bytesDirect

    // Update transport count if provided
    if (event.transportCount) {
      stats.transportCount += event.transportCount
    }

    // Update participant minutes if provided
    if (event.participantMinutes) {
      stats.participantMinutes += event.participantMinutes
    }

    // Recalculate ratio
    const totalBytes = stats.bytesRelayed + stats.bytesDirect
    stats.relayVsDirectRatio = totalBytes > 0 ? stats.bytesRelayed / totalBytes : 0

    // Recalculate cost
    stats.estimatedCost = calculateCost(stats.bytesRelayed)

    await stats.save()
  } catch (error) {
    console.error('Failed to track bandwidth:', error)
    throw error
  }
}

/**
 * Get daily bandwidth statistics for a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of daily stats
 */
export async function getDailyStats(
  startDate: Date,
  endDate: Date
): Promise<DailyBandwidthStats[]> {
  try {
    const stats = await BandwidthStats.aggregate([
      {
        $match: {
          date: { $gte: startOfDay(startDate), $lte: endOfDay(endDate) }
        }
      },
      {
        $group: {
          _id: '$date',
          totalBytesRelayed: { $sum: '$bytesRelayed' },
          totalBytesDirect: { $sum: '$bytesDirect' },
          totalCost: { $sum: '$estimatedCost' },
          roomCount: { $sum: 1 }
        }
      },
      {
        $project: {
          date: '$_id',
          totalBytesRelayed: 1,
          totalBytesDirect: 1,
          totalCost: 1,
          roomCount: 1,
          relayVsDirectRatio: {
            $cond: [
              { $eq: [{ $add: ['$totalBytesRelayed', '$totalBytesDirect'] }, 0] },
              0,
              { $divide: ['$totalBytesRelayed', { $add: ['$totalBytesRelayed', '$totalBytesDirect'] }] }
            ]
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ])

    return stats.map((s: any) => ({
      date: s.date,
      totalBytesRelayed: s.totalBytesRelayed,
      totalBytesDirect: s.totalBytesDirect,
      totalCost: s.totalCost,
      roomCount: s.roomCount,
      relayVsDirectRatio: s.relayVsDirectRatio
    }))
  } catch (error) {
    console.error('Failed to get daily stats:', error)
    return []
  }
}

/**
 * Get comprehensive bandwidth statistics for admin dashboard
 * @param startDate - Start date
 * @param endDate - End date
 * @param includeComparison - Include trends vs previous period
 * @returns Bandwidth statistics summary
 */
export async function getBandwidthSummary(
  startDate: Date,
  endDate: Date,
  includeComparison = false
): Promise<BandwidthStatsSummary> {
  try {
    // Get current period stats
    const dailyStats = await getDailyStats(startDate, endDate)

    // Aggregate totals
    const summary = {
      totalBytesRelayed: 0,
      totalBytesDirect: 0,
      totalCost: 0,
      relayVsDirectRatio: 0,
      totalGB: 0
    }

    for (const day of dailyStats) {
      summary.totalBytesRelayed += day.totalBytesRelayed
      summary.totalBytesDirect += day.totalBytesDirect
      summary.totalCost += day.totalCost
    }

    const totalBytes = summary.totalBytesRelayed + summary.totalBytesDirect
    summary.relayVsDirectRatio = totalBytes > 0 ? summary.totalBytesRelayed / totalBytes : 0
    summary.totalGB = totalBytes / (1024 * 1024 * 1024)

    // Get room breakdown
    const roomBreakdown = await BandwidthStats.aggregate([
      {
        $match: {
          date: { $gte: startOfDay(startDate), $lte: endOfDay(endDate) }
        }
      },
      {
        $group: {
          _id: '$roomId',
          bytesRelayed: { $sum: '$bytesRelayed' },
          bytesDirect: { $sum: '$bytesDirect' },
          cost: { $sum: '$estimatedCost' },
          sessionCount: { $sum: '$transportCount' }
        }
      },
      {
        $sort: { cost: -1 }
      },
      {
        $limit: 10
      }
    ])

    const formattedRooms: RoomBandwidth[] = roomBreakdown.map((r: any) => ({
      roomId: r._id.toString(),
      bytesRelayed: r.bytesRelayed,
      bytesDirect: r.bytesDirect,
      cost: r.cost,
      sessionCount: r.sessionCount
    }))

    // Format daily data
    const daily = dailyStats.map(d => ({
      date: d.date.toISOString(),
      bytesRelayed: d.totalBytesRelayed,
      bytesDirect: d.totalBytesDirect,
      cost: d.totalCost,
      roomCount: d.roomCount
    }))

    // Calculate trends if requested
    let trends: { costChange: number; usageChange: number } | undefined
    if (includeComparison && dailyStats.length > 0) {
      const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const prevStartDate = subDays(startDate, daysInRange)
      const prevEndDate = subDays(endDate, daysInRange)

      const prevStats = await getDailyStats(prevStartDate, prevEndDate)
      const prevTotalCost = prevStats.reduce((sum, d) => sum + d.totalCost, 0)
      const prevTotalBytes = prevStats.reduce(
        (sum, d) => sum + d.totalBytesRelayed + d.totalBytesDirect,
        0
      )
      const currentTotalBytes = totalBytes

      trends = {
        costChange: prevTotalCost > 0 ? ((summary.totalCost - prevTotalCost) / prevTotalCost) * 100 : 0,
        usageChange: prevTotalBytes > 0 ? ((currentTotalBytes - prevTotalBytes) / prevTotalBytes) * 100 : 0
      }
    }

    return {
      summary,
      daily,
      roomBreakdown: formattedRooms,
      trends
    }
  } catch (error) {
    console.error('Failed to get bandwidth summary:', error)
    return {
      summary: {
        totalBytesRelayed: 0,
        totalBytesDirect: 0,
        totalCost: 0,
        relayVsDirectRatio: 0,
        totalGB: 0
      },
      daily: [],
      roomBreakdown: []
    }
  }
}

/**
 * Aggregate bandwidth stats by date (for charting)
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of daily bandwidth totals
 */
export async function aggregateBandwidthStats(
  startDate: Date,
  endDate: Date
): Promise<DailyBandwidthStats[]> {
  return getDailyStats(startDate, endDate)
}
