/**
 * mediasoup-client wrapper
 *
 * Provides singleton Device instance and helper functions for creating
 * producers (outgoing media) and consumers (incoming media streams).
 *
 * Per mediasoup best practices: One Device instance per browser tab.
 */

import { Device, Producer, Consumer } from 'mediasoup-client'

// Singleton Device instance (one per browser tab)
let device: Device | null = null

/**
 * Create or reuse mediasoup Device instance
 *
 * @param routerRtpCapabilities - RTP capabilities from mediasoup server router
 * @returns Device instance
 */
export async function createDevice(routerRtpCapabilities: any): Promise<Device> {
  // Reuse existing device if available
  if (!device) {
    device = new Device()
  }

  // Load router RTP capabilities
  await device.load({ routerRtpCapabilities })

  return device
}

/**
 * Create producer for audio or video stream
 *
 * Producers send outgoing media (audio/video) to the SFU.
 *
 * @param transport - WebRTC transport (send or recv)
 * @param stream - MediaStream from getUserMedia
 * @param kind - 'audio' or 'video'
 * @returns Producer instance
 */
export async function createProducer(
  transport: any,
  stream: MediaStream,
  kind: 'audio' | 'video'
): Promise<Producer> {
  if (!device) {
    throw new Error('Device not initialized. Call createDevice first.')
  }

  // Extract appropriate track from MediaStream
  const track =
    kind === 'audio'
      ? stream.getAudioTracks()[0]
      : stream.getVideoTracks()[0]

  if (!track) {
    throw new Error(`No ${kind} track found in MediaStream`)
  }

  // Create producer
  const producer = await transport.produce({
    track,
    kind,
  })

  return producer
}

/**
 * Create consumer for incoming media stream
 *
 * Consumers receive media (audio/video) from other participants via the SFU.
 *
 * @param transport - WebRTC transport (recv transport)
 * @param producerId - ID of the producer to consume
 * @param rtpCapabilities - Device RTP capabilities
 * @returns Consumer instance
 */
export async function createConsumer(
  transport: any,
  producerId: string,
  rtpCapabilities: any
): Promise<Consumer> {
  if (!device) {
    throw new Error('Device not initialized. Call createDevice first.')
  }

  // Create consumer
  const consumer = await device.createConsumer({
    transport,
    producerId,
    rtpCapabilities,
  })

  return consumer
}

/**
 * Get current Device instance
 *
 * @returns Device instance or null
 */
export function getDevice(): Device | null {
  return device
}

/**
 * Close Device instance
 *
 * Call this when leaving a room to clean up resources.
 */
export function closeDevice(): void {
  if (device) {
    device = null
  }
}
