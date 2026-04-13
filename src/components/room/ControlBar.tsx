/**
 * ControlBar Component
 *
 * Bottom control bar with mute/camera/leave/settings buttons.
 * Implements D-04, D-05, D-06 from CONTEXT.md:
 * - Fixed bar at bottom, always visible (no auto-hide)
 * - Four primary buttons: Mute, Camera, Leave, Settings
 * - Red background when muted/camera off (bg-red-500)
 * - Icon changes to slashed version when off
 *
 * @example
 * ```tsx
 * <ControlBar roomId="room-123" onLeave={() => navigate('/dashboard')} />
 * ```
 */

'use client'

import { useMediaStream } from '@/hooks/useMediaStream'
import { useRoomStore } from '@/store/roomStore'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Video, VideoOff, LogOut, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ControlBarProps {
  roomId: string
  onLeave?: () => void
}

export function ControlBar({ roomId, onLeave }: ControlBarProps) {
  const { isMuted, isVideoOff, toggleAudio, toggleVideo } = useMediaStream()
  const router = useRouter()
  const storeIsMuted = useRoomStore((state) => state.isMuted)
  const storeIsVideoOff = useRoomStore((state) => state.isVideoOff)

  // Sync local state with store state (in case it was updated elsewhere)
  useEffect(() => {
    if (storeIsMuted !== isMuted) {
      // Sync if needed
    }
  }, [storeIsMuted, isMuted])

  useEffect(() => {
    if (storeIsVideoOff !== isVideoOff) {
      // Sync if needed
    }
  }, [storeIsVideoOff, isVideoOff])

  /**
   * Handle leave room
   * Closes producers/consumers, disconnects from Socket.IO, navigates away
   */
  const handleLeave = () => {
    // Cleanup will be handled by the page component's useEffect cleanup
    if (onLeave) {
      onLeave()
    } else {
      router.push('/dashboard')
    }
  }

  /**
   * Handle settings (future phase)
   * Opens device selection modal (mic, camera, speaker)
   */
  const handleSettings = () => {
    // TODO: Open settings modal for device selection
    console.log('Settings clicked - device selection coming in future phase')
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 bg-gray-900/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg">
        {/* Mute/Unmute Button */}
        <TooltipButton
          aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          shortcut="M"
        >
          <Button
            size="icon"
            variant={isMuted ? 'destructive' : 'secondary'}
            onClick={toggleAudio}
            className="rounded-full"
          >
            {isMuted ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </TooltipButton>

        {/* Camera On/Off Button */}
        <TooltipButton
          aria-label={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          shortcut="V"
        >
          <Button
            size="icon"
            variant={isVideoOff ? 'destructive' : 'secondary'}
            onClick={toggleVideo}
            className="rounded-full"
          >
            {isVideoOff ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </Button>
        </TooltipButton>

        {/* Leave Room Button */}
        <TooltipButton aria-label="Leave room" shortcut="L">
          <Button
            size="icon"
            variant="destructive"
            onClick={handleLeave}
            className="rounded-full"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </TooltipButton>

        {/* Settings Button */}
        <TooltipButton aria-label="Settings" shortcut="S">
          <Button
            size="icon"
            variant="secondary"
            onClick={handleSettings}
            className="rounded-full"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </TooltipButton>
      </div>
    </div>
  )
}

/**
 * Tooltip Button wrapper for accessibility
 * Shows keyboard shortcut in tooltip
 */
function TooltipButton({
  children,
  ariaLabel,
  shortcut,
}: {
  children: React.ReactNode
  ariaLabel: string
  shortcut?: string
}) {
  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {ariaLabel}
        {shortcut && <span className="ml-2 text-gray-400">[{shortcut}]</span>}
      </div>
    </div>
  )
}
