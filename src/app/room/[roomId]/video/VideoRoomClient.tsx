'use client'

/**
 * VideoRoomClient Component
 *
 * Main video room UI with complete layout:
 * - Header: Session timer + connection status + user info
 * - Main: VideoGrid component
 * - Overlay: ControlBar (fixed at bottom)
 * - Sidebar: Chat (from Phase 3, if visible)
 *
 * Integrates all video room components:
 * - VideoGrid: Auto-responsive grid for 1-12 participants
 * - VideoCard: Individual participant video with speaker border
 * - ControlBar: Bottom control bar with mute/camera/leave/settings
 * - SessionTimer: 45-minute countdown timer
 * - ConnectionStatus: Subtle connection quality indicator
 *
 * WebRTC integration:
 * - useMediaStream for local stream (mic/camera)
 * - useWebRTCConnection for producers/consumers
 * - useSocket for Socket.IO signaling
 * - roomStore for participant state
 */

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { VideoGrid } from '@/components/room/VideoGrid'
import { ControlBar } from '@/components/room/ControlBar'
import { SessionTimer } from '@/components/room/SessionTimer'
import { useMediaStream } from '@/hooks/useMediaStream'
import { useWebRTCConnection } from '@/hooks/useWebRTCConnection'
import { useSocket } from '@/hooks/useSocket'
import { useRoomStore } from '@/store/roomStore'
import { useRoomPresence } from '@/hooks/useRoomPresence'
import { useAttendanceTracking } from '@/hooks/useAttendanceTracking'
import { ParticipantList } from '@/components/room/ParticipantList'
import { ChatBox } from '@/components/room/ChatBox'
import { toast } from 'sonner'
import { Users, MessageSquare, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface VideoRoomClientProps {
  roomId: string
  roomTitle: string
  scheduledTime: string
  duration: number
  userId: string
  userName: string
  userPhoto: string | null
}

export default function VideoRoomClient({
  roomId,
  roomTitle,
  scheduledTime,
  duration,
  userId,
  userName,
  userPhoto,
}: VideoRoomClientProps) {
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false)

  // Initialize Socket.IO connection - returns socket instance and connection state
  const { socket, isConnected, isConnecting, disconnect } = useSocket(roomId)

  // Initialize media stream (mic/camera) - pass socket for event emissions
  const { stream, isMuted, isVideoOff, toggleAudio, toggleVideo } = useMediaStream(socket || undefined)

  // Initialize WebRTC connection (producers/consumers) - pass socket to avoid duplicate connections
  const { localProducer, consumers, error: webrtcError } = useWebRTCConnection({
    roomId,
    localStream: stream,
    socket: socket || undefined
  })

  // Initialize room presence tracking - pass socket to avoid duplicate connections
  useRoomPresence(roomId, socket || undefined)

  // Initialize attendance tracking (ROOM-08, D-13)
  // Track cumulative time in session (90+ seconds = attended)
  const { hasAttended } = useAttendanceTracking({
    sessionId: roomId,
    isConnected: localProducer !== null, // WebRTC connected when producer exists
    socket: socket || undefined
  })

  // Room store state
  const participants = useRoomStore((state) => state.participants)
  const activeSpeakerId = useRoomStore((state) => state.activeSpeakerId)

  // Convert consumers Map to array for VideoGrid
  // Map structure: Map<userId, Array<Consumer>>
  const consumersArray = useMemo(() => {
    const result: Array<{ id: string; userId: string; track: MediaStreamTrack }> = []
    consumers.forEach((consumerList: any[], userId: string) => {
      consumerList.forEach((consumer) => {
        if (consumer.track) {
          result.push({
            id: consumer.id,
            userId,
            track: consumer.track
          })
        }
      })
    })
    return result
  }, [consumers])

  // Handle WebRTC errors
  useEffect(() => {
    if (webrtcError) {
      toast.error(`Connection error: ${webrtcError}`)
    }
  }, [webrtcError])

  // Handle attendance confirmation notification
  useEffect(() => {
    if (hasAttended) {
      toast.success('Attendance confirmed! ✓', {
        description: 'You\'ve been marked as attended for this session',
        duration: 3000
      })
    }
  }, [hasAttended])

  // Handle leave room
  const handleLeaveRoom = () => {
    disconnect()
    router.push('/dashboard')
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-semibold text-lg">{roomTitle}</h1>
          <SessionTimer startTime={scheduledTime} durationMinutes={duration} />
        </div>

        <div className="flex items-center gap-4">
          {/* Connection status indicator */}
          {isConnected ? (
            <div className="flex items-center gap-1 text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-xs">Connected</span>
            </div>
          ) : isConnecting ? (
            <div className="flex items-center gap-1 text-yellow-400">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs">Connecting...</span>
            </div>
          ) : null}

          {/* Attendance status badge (ROOM-08) */}
          {hasAttended && (
            <Badge variant="secondary" className="bg-green-600 text-white hover:bg-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Attended
            </Badge>
          )}

          {/* Participant count */}
          <div className="flex items-center gap-2 text-white">
            <Users className="w-4 h-4" />
            <span className="text-sm">{participants.length}</span>
          </div>

          {/* Toggle chat button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="text-white hover:bg-gray-700"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          {/* Toggle participants button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
            className="text-white hover:bg-gray-700"
          >
            <Users className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video grid */}
        <main className="flex-1 overflow-auto">
          <VideoGrid consumers={consumersArray} localStream={stream} />
        </main>

        {/* Chat sidebar */}
        {isChatOpen && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <ChatBox roomId={roomId} />
          </aside>
        )}

        {/* Participants sidebar */}
        {isParticipantsOpen && (
          <aside className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
            <ParticipantList />
          </aside>
        )}
      </div>

      {/* Control bar */}
      <ControlBar roomId={roomId} onLeave={handleLeaveRoom} />
    </div>
  )
}
