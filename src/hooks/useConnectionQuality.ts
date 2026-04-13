import { useEffect, useState, useRef } from 'react'
import { Consumer } from 'mediasoup-client'

// ============================================================================
// Type Definitions
// ============================================================================

type ConnectionType = 'host' | 'srflx' | 'relay'
type QualityLevel = 'good' | 'degraded' | 'poor'

interface ConnectionQualityMetrics {
  bitrate: number // kbps (kilobits per second)
  packetLoss: number // percentage (0-100)
  connectionType: ConnectionType
  quality: QualityLevel
}

interface UseConnectionQualityOptions {
  consumer: Consumer | null
  pollInterval?: number // milliseconds (default: 5000ms)
  onQualityChange?: (quality: QualityLevel) => void
}

// ============================================================================
// Quality Thresholds
// ============================================================================()

const QUALITY_THRESHOLDS = {
  BITRATE: {
    GOOD: 500, // kbps
    POOR: 100, // kbps
  },
  PACKET_LOSS: {
    GOOD: 2, // percentage
    POOR: 10, // percentage
  },
} as const

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Monitors WebRTC connection quality using consumer stats
 *
 * @param consumer - The mediasoup consumer to monitor
 * @param pollInterval - Stats polling interval in ms (default: 5000ms)
 * @param onQualityChange - Callback when quality level changes
 *
 * @returns Connection quality metrics (bitrate, packet loss, connection type, quality)
 *
 * @example
 * ```tsx
 * const { bitrate, packetLoss, connectionType, quality } = useConnectionQuality(consumer)
 *
 * // Show status indicator
 * <div className={`status-${quality}`}>
 *   {quality} ({bitrate} kbps, {packetLoss}% loss)
 * </div>
 * ```
 */
export function useConnectionQuality({
  consumer,
  pollInterval = 5000, // 5 seconds default
  onQualityChange,
}: UseConnectionQualityOptions) {
  const [metrics, setMetrics] = useState<ConnectionQualityMetrics>({
    bitrate: 0,
    packetLoss: 0,
    connectionType: 'host',
    quality: 'good',
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const previousStatsRef = useRef<any>(null)
  const previousTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!consumer) {
      // Reset metrics when no consumer
      setMetrics({
        bitrate: 0,
        packetLoss: 0,
        connectionType: 'host',
        quality: 'good',
      })
      return
    }

    let mounted = true

    // Poll consumer stats
    const pollStats = async () => {
      if (!mounted || !consumer) return

      try {
        const stats = await consumer.getStats()
        const now = Date.now()

        // Calculate bitrate
        let bitrate = 0
        if (previousStatsRef.current && previousTimeRef.current) {
          const timeDiff = (now - previousTimeRef.current) / 1000 // seconds
          const byteCount = stats.byteCount - (previousStatsRef.current.byteCount || 0)

          if (timeDiff > 0 && byteCount >= 0) {
            // Convert bytes to kilobits: (bytes * 8) / 1000
            bitrate = Math.round((byteCount * 8) / timeDiff / 1000)
          }
        }

        // Calculate packet loss
        let packetLoss = 0
        if (stats.packetCount > 0) {
          packetLoss = (stats.packetsLost / stats.packetCount) * 100
        }

        // Determine connection type from ICE candidate pair
        // Note: This is a simplified check. Real implementation would parse ICE stats.
        let connectionType: ConnectionType = 'host'
        if (stats.hasOwnProperty('iceState')) {
          // mediasoup doesn't expose ICE type directly in consumer stats
          // This would need to be tracked at transport level
          // For now, default to 'host' (best case)
          connectionType = 'host'
        }

        // Determine quality level
        let quality: QualityLevel = 'good'

        const isLowBitrate = bitrate < QUALITY_THRESHOLDS.BITRATE.POOR
        const isDegradedBitrate =
          bitrate >= QUALITY_THRESHOLDS.BITRATE.POOR &&
          bitrate < QUALITY_THRESHOLDS.BITRATE.GOOD
        const isHighPacketLoss = packetLoss > QUALITY_THRESHOLDS.PACKET_LOSS.POOR
        const isDegradedPacketLoss =
          packetLoss >= QUALITY_THRESHOLDS.PACKET_LOSS.GOOD &&
          packetLoss <= QUALITY_THRESHOLDS.PACKET_LOSS.POOR

        if (isLowBitrate || isHighPacketLoss) {
          quality = 'poor'
        } else if (isDegradedBitrate || isDegradedPacketLoss) {
          quality = 'degraded'
        } else {
          quality = 'good'
        }

        // Update state
        const newMetrics: ConnectionQualityMetrics = {
          bitrate,
          packetLoss: Math.round(packetLoss * 100) / 100, // Round to 2 decimal places
          connectionType,
          quality,
        }

        setMetrics(newMetrics)

        // Notify quality change
        if (onQualityChange && metrics.quality !== quality) {
          onQualityChange(quality)
        }

        // Store for next calculation
        previousStatsRef.current = stats
        previousTimeRef.current = now
      } catch (err) {
        console.error('Error polling consumer stats:', err)
      }
    }

    // Initial poll
    pollStats()

    // Set up polling interval
    intervalRef.current = setInterval(pollStats, pollInterval)

    // Cleanup function
    return () => {
      mounted = false

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      previousStatsRef.current = null
      previousTimeRef.current = 0
    }
  }, [consumer, pollInterval, onQualityChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return metrics
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get color class for quality level (for Tailwind CSS)
 */
export function getQualityColor(quality: QualityLevel): string {
  switch (quality) {
    case 'good':
      return 'text-green-500'
    case 'degraded':
      return 'text-yellow-500'
    case 'poor':
      return 'text-red-500'
    default:
      return 'text-gray-500'
  }
}

/**
 * Get icon name for quality level (for lucide-react)
 */
export function getQualityIcon(quality: QualityLevel): string {
  switch (quality) {
    case 'good':
      return 'SignalHigh' // or 'WifiHigh'
    case 'degraded':
      return 'SignalMedium' // or 'WifiMedium'
    case 'poor':
      return 'SignalLow' // or 'WifiLow'
    default:
      return 'SignalNone' // or 'WifiOff'
  }
}

/**
 * Get label for quality level
 */
export function getQualityLabel(quality: QualityLevel): string {
  switch (quality) {
    case 'good':
      return 'Good connection'
    case 'degraded':
      return 'Degraded connection'
    case 'poor':
      return 'Poor connection'
    default:
      return 'Unknown'
  }
}

/**
 * Get connection type label
 */
export function getConnectionTypeLabel(connectionType: ConnectionType): string {
  switch (connectionType) {
    case 'host':
      return 'Direct connection'
    case 'srflx':
      return 'STUN relay'
    case 'relay':
      return 'TURN relay'
    default:
      return 'Unknown'
  }
}
