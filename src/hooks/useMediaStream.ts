/**
 * useMediaStream hook
 *
 * Manages camera and microphone access with mute/unmute controls.
 * Handles getUserMedia permission requests and track lifecycle.
 */

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Socket } from '@/lib/socket'

export function useMediaStream(socket?: Socket) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)

  // Track references for mute/unmute
  const audioTrackRef = useRef<MediaStreamTrack | null>(null)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)

  useEffect(() => {
    let mediaStream: MediaStream | null = null

    async function getMedia() {
      try {
        // Request camera and microphone access
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        })

        setStream(mediaStream)

        // Store track references for mute/unmute
        audioTrackRef.current = mediaStream.getAudioTracks()[0] || null
        videoTrackRef.current = mediaStream.getVideoTracks()[0] || null
      } catch (error) {
        console.error('Error accessing media devices:', error)

        // Show user-friendly error message
        const errorMessage =
          error instanceof Error && error.name === 'NotAllowedError'
            ? 'Camera and microphone access is required to join a focus room. Please allow access in your browser settings.'
            : 'Could not access camera or microphone. Please check your device permissions.'

        toast.error(errorMessage)
      }
    }

    getMedia()

    // Cleanup: stop all tracks when component unmounts
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  /**
   * Toggle microphone mute/unmute
   *
   * Implements D-04 from CONTEXT.md: Audio mute control with Socket.IO notification
   */
  const toggleAudio = () => {
    if (audioTrackRef.current) {
      const newMutedState = !isMuted
      audioTrackRef.current.enabled = !newMutedState
      setIsMuted(newMutedState)

      // Notify server via Socket.IO if socket is available
      if (socket) {
        socket.emit('toggle-audio', { isMuted: newMutedState })
      }
    }
  }

  /**
   * Toggle camera on/off
   *
   * Implements D-04 from CONTEXT.md: Video toggle control with Socket.IO notification
   */
  const toggleVideo = () => {
    if (videoTrackRef.current) {
      const newVideoState = !isVideoOff
      videoTrackRef.current.enabled = !newVideoState
      setIsVideoOff(newVideoState)

      // Notify server via Socket.IO if socket is available
      if (socket) {
        socket.emit('toggle-video', { isVideoOff: newVideoState })
      }
    }
  }

  return {
    stream,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
  }
}
