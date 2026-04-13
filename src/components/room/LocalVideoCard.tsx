/**
 * LocalVideoCard Component
 *
 * Displays the local user's video stream.
 * Mirrored by default for natural user experience.
 */

'use client'

import { useRef, useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MicOff, Mic, VideoOff, Video } from 'lucide-react'
import { useMediaStream } from '@/hooks/useMediaStream'

interface LocalVideoCardProps {
  stream: MediaStream
  isLocal?: boolean
}

export function LocalVideoCard({ stream, isLocal = false }: LocalVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      const videoElement = videoRef.current
      videoElement.srcObject = stream

      videoElement.play().catch((err) => {
        console.error('Error playing local video:', err)
      })

      return () => {
        if (videoElement.srcObject) {
          const tracks = (videoElement.srcObject as MediaStream).getTracks()
          tracks.forEach((track) => track.stop())
          videoElement.srcObject = null
        }
      }
    }
  }, [stream])

  // Check stream state for mute indicators
  useEffect(() => {
    if (stream) {
      const audioTracks = stream.getAudioTracks()
      const videoTracks = stream.getVideoTracks()

      setIsMuted(audioTracks.length > 0 && !audioTracks[0].enabled)
      setIsVideoOff(videoTracks.length === 0 || !videoTracks[0].enabled)

      const handleTrackChange = () => {
        const audio = stream.getAudioTracks()
        const video = stream.getVideoTracks()
        setIsMuted(audio.length > 0 && !audio[0].enabled)
        setIsVideoOff(video.length === 0 || !video[0].enabled)
      }

      stream.addEventListener('addtrack', handleTrackChange)
      stream.addEventListener('removetrack', handleTrackChange)

      return () => {
        stream.removeEventListener('addtrack', handleTrackChange)
        stream.removeEventListener('removetrack', handleTrackChange)
      }
    }
  }, [stream])

  return (
    <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
      {/* Video element or placeholder */}
      {!isVideoOff ? (
        <video
          ref={videoRef}
          className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
          playsInline
          muted
          autoPlay
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-800">
          <div className="text-center">
            <VideoOff className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Camera is off</p>
          </div>
        </div>
      )}

      {/* Mute indicator */}
      {isMuted && (
        <div className="absolute top-2 left-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        </div>
      )}

      {/* Local user label */}
      {isLocal && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center gap-2">
            <span className="text-white text-sm font-medium">You</span>
          </div>
        </div>
      )}
    </div>
  )
}
