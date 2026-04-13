/**
 * VideoGrid Component
 *
 * Auto-responsive grid layout for 1-12 participants in a focus room.
 * Adapts grid layout based on participant count per D-01 from CONTEXT.md:
 * - 1-3 participants: Full-width rows (grid-cols-1)
 * - 4-6 participants: 2x3 grid (grid-cols-2)
 * - 7-9 participants: 3x3 grid (grid-cols-3)
 * - 10-12 participants: 3x4 grid (grid-cols-3)
 *
 * @example
 * ```tsx
 * <VideoGrid consumers={consumers} localStream={localStream} />
 * ```
 */

'use client'

import { useMemo } from 'react'
import { useRoomStore } from '@/store/roomStore'
import { VideoCard } from './VideoCard'
import { Users } from 'lucide-react'
import { LocalVideoCard } from './LocalVideoCard'

interface VideoGridProps {
  consumers: Array<{ id: string; userId: string; track: MediaStreamTrack }>
  localStream?: MediaStream | null
}

export function VideoGrid({ consumers, localStream }: VideoGridProps) {
  const participants = useRoomStore((state) => state.participants)
  const activeSpeakerId = useRoomStore((state) => state.activeSpeakerId)
  const currentUserId = useRoomStore((state) => state.currentUserId)

  // Create a map of consumers by userId for quick lookup
  const consumersByUserId = useMemo(() => {
    const map = new Map<string, { id: string; track: MediaStreamTrack }>()
    consumers.forEach(consumer => {
      map.set(consumer.userId, { id: consumer.id, track: consumer.track })
    })
    return map
  }, [consumers])

  const participantCount = participants.length

  /**
   * Calculate responsive grid class based on participant count
   * Implements D-01: Auto-responsive grid layout
   */
  const getGridClass = (count: number): string => {
    if (count <= 1) return 'grid-cols-1'
    if (count <= 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // Full-width rows for small count
    if (count <= 6) return 'grid-cols-2' // 2x3 grid
    if (count <= 9) return 'grid-cols-3' // 3x3 grid
    return 'grid-cols-3 lg:grid-cols-4' // 3x4 grid (10-12 participants)
  }

  // Empty state: only you in the room
  if (participantCount === 0 && localStream) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="w-full max-w-2xl px-4">
          <LocalVideoCard stream={localStream} isLocal />
        </div>
      </div>
    )
  }

  // Waiting for others
  if (participantCount === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">Waiting for others to join...</p>
          <p className="text-gray-500 text-sm mt-2">You'll see participants here when they arrive</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`grid ${getGridClass(participantCount + 1)} gap-4 p-4`}>
      {/* Local user video */}
      {localStream && (
        <LocalVideoCard stream={localStream} isLocal />
      )}

      {/* Remote participants */}
      {participants.map((participant) => {
        const consumer = consumersByUserId.get(participant.userId)
        return (
          <VideoCard
            key={participant.userId}
            participant={participant}
            consumer={consumer ? { id: consumer.id, track: consumer.track } : undefined}
            isActiveSpeaker={participant.userId === activeSpeakerId}
          />
        )
      })}
    </div>
  )
}
