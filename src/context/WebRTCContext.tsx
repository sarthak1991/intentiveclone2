/**
 * WebRTCContext
 *
 * Provides global WebRTC state sharing across components.
 * Combines useMediaStream and useWebRTCConnection hooks for unified access.
 */

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useMediaStream } from '@/hooks/useMediaStream'
import { useWebRTCConnection } from '@/hooks/useWebRTCConnection'

// ============================================================================
// Type Definitions
// ============================================================================

interface WebRTCContextValue {
  // Local media stream
  localStream: MediaStream | null
  isMuted: boolean
  isVideoOff: boolean
  toggleAudio: () => void
  toggleVideo: () => void

  // WebRTC connection
  device: any | null
  sendTransport: any | null
  recvTransport: any | null
  producers: Map<string, any>
  consumers: Map<string, any[]>
  isLoading: boolean
  error: Error | null

  // Additional functions from useWebRTCConnection
  replaceTrack?: (kind: 'audio' | 'video', newTrack: MediaStreamTrack) => Promise<boolean>
  createConsumer?: (transport: any, producerId: string, userId: string) => Promise<any | null>
  attachConsumerTrack?: (consumer: any, videoElement: HTMLVideoElement) => void
}

interface WebRTCProviderProps {
  children: ReactNode
  roomId: string
}

// ============================================================================
// Context
// ============================================================================

const WebRTCContext = createContext<WebRTCContextValue | null>(null)

// ============================================================================
// Provider Component
// ============================================================================

export function WebRTCProvider({ children, roomId }: WebRTCProviderProps) {
  // Get local media stream (camera/microphone)
  const { stream, isMuted, isVideoOff, toggleAudio, toggleVideo } = useMediaStream()

  // Get WebRTC connection (device, transports, producers, consumers)
  const webrtcConnection = useWebRTCConnection({
    roomId,
    localStream: stream,
  })

  // Combine all values into single context
  const contextValue: WebRTCContextValue = {
    // Local media stream
    localStream: stream,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,

    // WebRTC connection
    device: webrtcConnection.device,
    sendTransport: webrtcConnection.sendTransport,
    recvTransport: webrtcConnection.recvTransport,
    producers: webrtcConnection.producers,
    consumers: webrtcConnection.consumers,
    isLoading: webrtcConnection.isLoading,
    error: webrtcConnection.error,

    // Additional functions
    replaceTrack: webrtcConnection.replaceTrack,
    createConsumer: webrtcConnection.createConsumer,
    attachConsumerTrack: webrtcConnection.attachConsumerTrack,
  }

  return <WebRTCContext.Provider value={contextValue}>{children}</WebRTCContext.Provider>
}

// ============================================================================
// Hook for Easy Context Access
// ============================================================================

export function useWebRTCContext() {
  const context = useContext(WebRTCContext)

  if (!context) {
    throw new Error('useWebRTCContext must be used within WebRTCProvider')
  }

  return context
}

// ============================================================================
// Convenience Hook Generator
// ============================================================================

/**
 * Create a typed hook for accessing WebRTC context
 * Use this to create context-specific hooks if needed
 */
export function createWebRTCContextHook() {
  return () => {
    const context = useContext(WebRTCContext)

    if (!context) {
      throw new Error('useWebRTCContext must be used within WebRTCProvider')
    }

    return context
  }
}
