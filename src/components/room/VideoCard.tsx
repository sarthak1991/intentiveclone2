/**
 * VideoCard Component
 *
 * Individual video participant card with speaker border highlight.
 * Displays participant video stream, name, photo, and connection quality.
 *
 * Features per D-03 from CONTEXT.md:
 * - 2px solid border for active speaker (ring-2 ring-accent)
 * - No animation (avoids distraction for ADHD users)
 * - Connection quality indicator in top-right corner
 * - Participant info overlay in bottom-left
 *
 * @example
 * ```tsx
 * <VideoCard
 *   participant={participant}
 *   isActiveSpeaker={true}
 *   onMuteToggle={(userId) => console.log('Mute:', userId)}
 * />
 * ```
 */

'use client'

import { useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CameraOff } from 'lucide-react'
import { useConnectionQuality, getQualityColor } from '@/hooks/useConnectionQuality'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface Participant {
  userId: string
  userName: string
  userPhoto?: string
}

export interface Consumer {
  id: string
  track: MediaStreamTrack | null
}

interface VideoCardProps {
  participant: Participant
  consumer?: Consumer | null
  isActiveSpeaker?: boolean
  onMuteToggle?: (userId: string) => void
}

export function VideoCard({ participant, consumer, isActiveSpeaker = false }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { bitrate, packetLoss, quality, connectionType } = useConnectionQuality({
    consumer: consumer || null,
    pollInterval: 5000,
  })

  // Attach consumer track to video element
  useEffect(() => {
    if (consumer?.track && videoRef.current) {
      const videoElement = videoRef.current

      // Create MediaStream from track
      const stream = new MediaStream([consumer.track])
      videoElement.srcObject = stream

      // Play video
      videoElement.play().catch((err) => {
        console.error('Error playing video:', err)
      })

      return () => {
        // Cleanup: stop stream
        if (videoElement.srcObject) {
          const tracks = (videoElement.srcObject as MediaStream).getTracks()
          tracks.forEach((track) => track.stop())
          videoElement.srcObject = null
        }
      }
    }
  }, [consumer])

  // Get participant initials for avatar fallback
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase()
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  // Has video track available
  const hasVideo = consumer?.track?.kind === 'video'

  return (
    <div
      className={`
        relative aspect-video bg-gray-900 rounded-lg overflow-hidden
        ${isActiveSpeaker ? 'ring-2 ring-accent' : ''}
      `}
    >
      {/* Video element or placeholder */}
      {hasVideo ? (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <Avatar className="w-24 h-24">
            {participant.userPhoto ? (
              <AvatarImage src={participant.userPhoto} alt={participant.userName} />
            ) : null}
            <AvatarFallback className="text-3xl bg-gray-700 text-gray-300">
              {getInitials(participant.userName)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-16 flex items-center gap-2">
            <CameraOff className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      )}

      {/* Connection quality indicator (top-right) */}
      {consumer && (
        <div className="absolute top-2 right-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className={`
                    w-2 h-2 rounded-full cursor-pointer
                    ${getQualityColor(quality).replace('text-', 'bg-')}
                  `}
                />
              </TooltipTrigger>
              <TooltipContent side="left">
                <div className="text-xs space-y-1">
                  <p className="font-semibold">{quality.toUpperCase()} CONNECTION</p>
                  <p>Bitrate: {bitrate} kbps</p>
                  <p>Packet loss: {packetLoss.toFixed(1)}%</p>
                  <p>Type: {connectionType}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      {/* Participant info overlay (bottom-left) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            {participant.userPhoto ? (
              <AvatarImage src={participant.userPhoto} alt={participant.userName} />
            ) : null}
            <AvatarFallback className="text-sm bg-gray-700 text-white">
              {getInitials(participant.userName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-white text-sm font-medium truncate">{participant.userName}</span>
        </div>
      </div>

      {/* Active speaker indicator (bottom-right) */}
      {isActiveSpeaker && (
        <div className="absolute bottom-3 right-3">
          <span className="px-2 py-1 bg-accent text-white text-xs font-semibold rounded">
            Speaking
          </span>
        </div>
      )}
    </div>
  )
}
