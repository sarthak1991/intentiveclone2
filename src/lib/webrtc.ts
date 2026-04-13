/**
 * WebRTC utility functions
 *
 * Provides ICE server configuration and codec support detection
 * for WebRTC connections.
 */

/**
 * Build ICE server configuration for WebRTC
 *
 * Includes Google public STUN (free), self-hosted TURN (if configured),
 * and fallback STUN servers for maximum connectivity.
 *
 * @param turnServerUrl - TURN server URL (optional)
 * @param turnUsername - TURN username (optional)
 * @param turnCredential - TURN credential (optional)
 * @returns RTCConfiguration['iceServers'] array
 */
export function getIceServers({
  turnServerUrl,
  turnUsername,
  turnCredential,
}: {
  turnServerUrl?: string
  turnUsername?: string
  turnCredential?: string
} = {}): RTCConfiguration['iceServers'] {
  const iceServers: RTCConfiguration['iceServers'] = [
    // Google public STUN (free, reliable)
    { urls: 'stun:stun.l.google.com:19302' },

    // Fallback STUN servers
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]

  // Add TURN server if configured
  if (turnServerUrl && turnUsername && turnCredential) {
    iceServers.push({
      urls: `turn:${turnServerUrl}:3478`,
      username: turnUsername,
      credential: turnCredential,
    })

    // Add TURN with TCP fallback for restrictive firewalls
    iceServers.push({
      urls: `turn:${turnServerUrl}:3478?transport=tcp`,
      username: turnUsername,
      credential: turnCredential,
    })
  }

  return iceServers
}

/**
 * Check if device supports a specific codec
 *
 * @param device - mediasoup Device instance
 * @param codecMimeType - Codec MIME type (e.g., 'audio/opus', 'video/VP8')
 * @returns true if codec is supported
 */
export function deviceSupportsCodec(
  device: any,
  codecMimeType: string
): boolean {
  if (!device || !device.rtpCapabilities) {
    return false
  }

  return device.rtpCapabilities.codecs?.some(
    (codec: any) => codec.mimeType === codecMimeType
  )
}

/**
 * Get preferred audio codecs in order of preference
 *
 * @returns Array of codec MIME types
 */
export function getPreferredAudioCodecs(): string[] {
  return ['audio/opus', 'audio/PCMU', 'audio/PCMA']
}

/**
 * Get preferred video codecs in order of preference
 *
 * VP9 for better compression, H.264 for hardware acceleration, VP8 for compatibility
 *
 * @returns Array of codec MIME types
 */
export function getPreferredVideoCodecs(): string[] {
  return ['video/VP9', 'video/H264', 'video/VP8']
}
