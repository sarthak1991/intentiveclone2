/**
 * ConnectionStatus Component
 *
 * Subtle connection quality indicator for video room.
 * Implements D-11 from CONTEXT.md:
 * - Small dot indicator (green/yellow/red) next to user's name
 * - Tooltip on hover shows details (bitrate, packet loss, connection type)
 * - No intrusive alerts or full-screen notifications
 * - Silent reconnection in background (use existing Socket.IO reconnection)
 *
 * @example
 * ```tsx
 * <ConnectionStatus
 *   quality="good"
 *   bitrate={1200}
 *   packetLoss={0.5}
 *   connectionType="host"
 * />
 * ```
 */

'use client'

import { useConnectionQuality, getQualityColor, getConnectionTypeLabel } from '@/hooks/useConnectionQuality'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SimpleConsumer {
  id: string
  track: MediaStreamTrack
}

interface ConnectionStatusProps {
  consumer: (Consumer | null) | SimpleConsumer | null
}

export function ConnectionStatus({ consumer }: ConnectionStatusProps) {
  const { bitrate, packetLoss, quality, connectionType } = useConnectionQuality({
    consumer,
    pollInterval: 5000,
  })

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                w-2 h-2 rounded-full cursor-pointer
                ${getQualityColor(quality).replace('text-', 'bg-')}
              `}
              aria-label={`Connection quality: ${quality}`}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs space-y-1">
              <p className="font-semibold">{quality.toUpperCase()} CONNECTION</p>
              <p>Bitrate: {bitrate} kbps</p>
              <p>Packet loss: {packetLoss.toFixed(1)}%</p>
              <p>Type: {getConnectionTypeLabel(connectionType)}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

/**
 * Standalone connection status dot with manual quality props
 * Use this when you have quality metrics from another source
 */
interface ConnectionStatusDotProps {
  quality: 'good' | 'degraded' | 'poor'
  bitrate?: number
  packetLoss?: number
  connectionType?: 'host' | 'srflx' | 'relay'
}

export function ConnectionStatusDot({
  quality,
  bitrate = 0,
  packetLoss = 0,
  connectionType = 'host',
}: ConnectionStatusDotProps) {
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`
                w-2 h-2 rounded-full cursor-pointer
                ${getQualityColor(quality).replace('text-', 'bg-')}
              `}
              aria-label={`Connection quality: ${quality}`}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs space-y-1">
              <p className="font-semibold">{quality.toUpperCase()} CONNECTION</p>
              {bitrate > 0 && <p>Bitrate: {bitrate} kbps</p>}
              {packetLoss > 0 && <p>Packet loss: {packetLoss.toFixed(1)}%</p>}
              <p>Type: {getConnectionTypeLabel(connectionType)}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}
