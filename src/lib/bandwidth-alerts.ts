import { startOfDay } from 'date-fns'
import { BandwidthStats } from '@/models/BandwidthStats'

/**
 * Bandwidth alert types
 */
export type BandwidthAlertType = 'warning' | 'critical' | 'cost'

/**
 * Bandwidth alert
 */
export interface BandwidthAlert {
  type: BandwidthAlertType
  message: string
  current: number
  threshold: number
  timestamp: Date
}

// Threshold values from environment variables
const WARNING_THRESHOLD = parseInt(process.env.BANDWIDTH_WARNING_THRESHOLD || '80', 10)
const CRITICAL_THRESHOLD = parseInt(process.env.BANDWIDTH_CRITICAL_THRESHOLD || '90', 10)
const COST_THRESHOLD = parseFloat(process.env.BANDWIDTH_COST_THRESHOLD || '5.00')
const MONTHLY_QUOTA_GB = parseFloat(process.env.BANDWIDTH_MONTHLY_QUOTA_GB || '1000')

/**
 * Check bandwidth thresholds and return active alerts
 * @returns Array of active alerts (empty if none)
 */
export async function checkBandwidthAlerts(): Promise<BandwidthAlert[]> {
  const alerts: BandwidthAlert[] = []
  const today = startOfDay(new Date())

  try {
    // Get today's bandwidth stats
    const todayStats = await BandwidthStats.aggregate([
      {
        $match: { date: today }
      },
      {
        $group: {
          _id: null,
          totalBytesRelayed: { $sum: '$bytesRelayed' },
          totalCost: { $sum: '$estimatedCost' }
        }
      }
    ])

    if (todayStats.length === 0) {
      return alerts // No data yet
    }

    const { totalBytesRelayed, totalCost } = todayStats[0]

    // Convert to GB
    const totalGB = totalBytesRelayed / (1024 ** 3)

    // Calculate quota percentage
    const quotaPercentage = (totalGB / MONTHLY_QUOTA_GB) * 100

    // Check critical threshold
    if (quotaPercentage >= CRITICAL_THRESHOLD) {
      alerts.push({
        type: 'critical',
        message: `Critical bandwidth usage: ${quotaPercentage.toFixed(1)}% of monthly quota`,
        current: quotaPercentage,
        threshold: CRITICAL_THRESHOLD,
        timestamp: new Date()
      })
    }

    // Check warning threshold
    if (quotaPercentage >= WARNING_THRESHOLD && quotaPercentage < CRITICAL_THRESHOLD) {
      alerts.push({
        type: 'warning',
        message: `High bandwidth usage: ${quotaPercentage.toFixed(1)}% of monthly quota`,
        current: quotaPercentage,
        threshold: WARNING_THRESHOLD,
        timestamp: new Date()
      })
    }

    // Check cost threshold
    if (totalCost >= COST_THRESHOLD) {
      alerts.push({
        type: 'cost',
        message: `Daily cost threshold exceeded: $${totalCost.toFixed(2)}`,
        current: totalCost,
        threshold: COST_THRESHOLD,
        timestamp: new Date()
      })
    }

    return alerts
  } catch (error) {
    console.error('Failed to check bandwidth alerts:', error)
    return []
  }
}

/**
 * Send bandwidth alert via email
 * @param alert - Alert to send
 */
export async function sendBandwidthAlert(alert: BandwidthAlert): Promise<void> {
  try {
    // Log alert for debugging
    console.error('BANDWIDTH ALERT:', {
      type: alert.type,
      message: alert.message,
      current: alert.current,
      threshold: alert.threshold,
      timestamp: alert.timestamp
    })

    // In production, send email via nodemailer
    // This would use the existing email infrastructure from notifications
    // For now, logging is sufficient for development
  } catch (error) {
    console.error('Failed to send bandwidth alert:', error)
  }
}
