import { useEffect, useState, useRef } from 'react'
import { Device, Producer, Transport } from 'mediasoup-client'
import { connectToRoom } from '@/lib/socket'
import { useRoomStore } from '@/store/roomStore'
import type { Socket } from '@/lib/socket'

// ============================================================================
// Type Definitions
// ============================================================================

interface WebRTCConnectionState {
  device: Device | null
  sendTransport: Transport | null
  recvTransport: Transport | null
  producers: Map<string, Producer>
  consumers: Map<string, any[]>
}

interface UseWebRTCConnectionOptions {
  roomId: string
  localStream: MediaStream | null
  socket?: Socket
  onConnect?: () => void
  onError?: (error: Error) => void
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useWebRTCConnection({
  roomId,
  localStream,
  socket: externalSocket,
  onConnect,
  onError,
}: UseWebRTCConnectionOptions) {
  const [state, setState] = useState<WebRTCConnectionState>({
    device: null,
    sendTransport: null,
    recvTransport: null,
    producers: new Map(),
    consumers: new Map(),
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Use external socket if provided, otherwise create new connection
  const socketRef = useRef(externalSocket || connectToRoom(roomId))
  const cleanupRef = useRef<(() => void)[]>([])

  const { setMuted, setVideoOff, addProducer, addConsumer, removeConsumer, setActiveSpeakerId } = useRoomStore()

  useEffect(() => {
    const socket = socketRef.current
    let mounted = true

    const initializeWebRTC = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Step 1: Get router RTP capabilities from server
        socket.emit('get-router-rtp-capabilities')

        // Step 2: Create device and load capabilities
        socket.on('router-rtp-capabilities', async ({ rtpCapabilities }) => {
          if (!mounted) return

          try {
            const device = new Device()
            await device.load({ routerRtpCapabilities })

            setState((prev) => ({ ...prev, device }))

            // Step 3: Create send transport for producers
            socket.emit('create-transport', { forceTcp: false })
          } catch (err) {
            console.error('Error loading device:', err)
            onError?.(err as Error)
            setError(err as Error)
            setIsLoading(false)
          }
        })

        // Step 4: Handle send transport creation
        socket.on('transport-created', async ({ id, iceParameters, iceCandidates, dtlsParameters }) => {
          if (!mounted || !state.device) return

          try {
            // Create send transport for producers
            const sendTransport = state.device.createSendTransport({
              id,
              iceParameters,
              iceCandidates,
              dtlsParameters,
            })

            // Handle transport connection
            sendTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
              socket.emit('connect-transport', {
                transportId: id,
                dtlsParameters,
              })

              socket.on('transport-connected', callback)
              socket.on('transport-connect-error', errback)
            })

            // Handle producer creation
            sendTransport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
              socket.emit('produce', {
                transportId: id,
                kind,
                rtpParameters,
              })

              socket.on('producer-created', callback)
              socket.on('produce-error', errback)
            })

            setState((prev) => ({ ...prev, sendTransport }))

            // Step 5: Create receive transport for consumers
            socket.emit('create-transport', { forceTcp: false })
          } catch (err) {
            console.error('Error creating transport:', err)
            onError?.(err as Error)
            setError(err as Error)
            setIsLoading(false)
          }
        })

        // Step 6: Handle receive transport creation
        socket.on('transport-created', async ({ id, iceParameters, iceCandidates, dtlsParameters }) => {
          if (!mounted || !state.device || state.recvTransport) return

          try {
            const recvTransport = state.device.createRecvTransport({
              id,
              iceParameters,
              iceCandidates,
              dtlsParameters,
            })

            // Handle transport connection
            recvTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
              socket.emit('connect-transport', {
                transportId: id,
                dtlsParameters,
              })

              socket.on('transport-connected', callback)
              socket.on('transport-connect-error', errback)
            })

            setState((prev) => ({ ...prev, recvTransport }))

            // Step 7: Create producers for audio/video
            if (localStream && sendTransport) {
              await produceAudio(sendTransport, localStream)
              await produceVideo(sendTransport, localStream)
            }

            setIsLoading(false)
            onConnect?.()
          } catch (err) {
            console.error('Error creating receive transport:', err)
            onError?.(err as Error)
            setError(err as Error)
            setIsLoading(false)
          }
        })

        // Step 8: Listen for new producers from other participants
        socket.on('new-producer', async ({ producerId, userId, kind }) => {
          if (!mounted || !state.recvTransport || !state.device) return

          try {
            // Don't consume own producers
            const currentUserId = socket.id
            if (userId === currentUserId) return

            // Request consume from server
            socket.emit('consume', {
              producerId,
              rtpCapabilities: state.device.rtpCapabilities,
            })

            // Handle consumer creation
            socket.on('consumer-created', async ({ id, producerId, kind, rtpParameters }) => {
              if (!mounted || !state.recvTransport) return

              try {
                const consumer = await state.recvTransport.consume({
                  id,
                  producerId,
                  kind,
                  rtpParameters,
                })

                // Store consumer
                const consumers = new Map(state.consumers)
                const userConsumers = consumers.get(userId) || []
                consumers.set(userId, [...userConsumers, consumer])
                setState((prev) => ({ ...prev, consumers }))

                // Add to roomStore
                addConsumer(userId, consumer)

                // Resume consumer to start receiving media
                consumer.resume()
                socket.emit('resume-consumer', { consumerId: id })

                // Attach track to video element (will be handled by VideoCard component)
              } catch (err) {
                console.error('Error creating consumer:', err)
              }
            })
          } catch (err) {
            console.error('Error handling new-producer:', err)
          }
        })

        // Handle user leaving - clean up consumers
        socket.on('user-left', ({ userId }) => {
          if (!mounted) return

          const consumers = state.consumers.get(userId) || []
          consumers.forEach((consumer) => {
            consumer.close()
            removeConsumer(userId, consumer.id)
          })

          const newConsumers = new Map(state.consumers)
          newConsumers.delete(userId)
          setState((prev) => ({ ...prev, consumers: newConsumers }))
        })
      } catch (err) {
        console.error('Error initializing WebRTC:', err)
        onError?.(err as Error)
        setError(err as Error)
        setIsLoading(false)
      }
    }

    initializeWebRTC()

    // Cleanup function
    return () => {
      mounted = false

      // Close all producers
      state.producers.forEach((producer) => {
        producer.close()
      })

      // Close all consumers
      state.consumers.forEach((consumers) => {
        consumers.forEach((consumer) => {
          consumer.close()
        })
      })

      // Close transports
      state.sendTransport?.close()
      state.recvTransport?.close()

      // Run cleanup functions
      cleanupRef.current.forEach((cleanup) => cleanup())
      cleanupRef.current = []
    }
  }, [roomId, localStream])

  // ==========================================================================
  // Consumer Functions
  // ==========================================================================

  async function createConsumer(
    transport: Transport,
    producerId: string,
    userId: string
  ): Promise<any | null> {
    if (!state.device) return null

    try {
      // Request consume from server
      socket.emit('consume', {
        producerId,
        rtpCapabilities: state.device.rtpCapabilities,
      })

      // Wait for consumer-created event
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Consumer creation timeout'))
        }, 5000)

        socket.once('consumer-created', async ({ id, producerId, kind, rtpParameters }) => {
          clearTimeout(timeout)

          try {
            const consumer = await transport.consume({
              id,
              producerId,
              kind,
              rtpParameters,
            })

            // Store consumer
            const consumers = new Map(state.consumers)
            const userConsumers = consumers.get(userId) || []
            consumers.set(userId, [...userConsumers, consumer])
            setState((prev) => ({ ...prev, consumers }))

            // Add to roomStore
            addConsumer(userId, consumer)

            // Handle consumer track mute/unmute
            consumer.on('trackended', () => {
              // Track ended (remote user stopped sharing)
              removeConsumer(userId, consumer.id)
              const newConsumers = new Map(state.consumers)
              const userConsumers = newConsumers.get(userId) || []
              newConsumers.set(userId, userConsumers.filter((c) => c.id !== consumer.id))
              setState((prev) => ({ ...prev, consumers: newConsumers }))
            })

            consumer.on('transportclose', () => {
              // Transport closed
              removeConsumer(userId, consumer.id)
            })

            resolve(consumer)
          } catch (err) {
            reject(err)
          }
        })

        socket.once('consume-error', (error) => {
          clearTimeout(timeout)
          reject(new Error(error.message || 'Consumer creation failed'))
        })
      })
    } catch (err) {
      console.error('Error creating consumer:', err)
      return null
    }
  }

  function attachConsumerTrack(consumer: any, videoElement: HTMLVideoElement): void {
    if (!consumer.track) return

    // Create new MediaStream from consumer track
    const stream = new MediaStream([consumer.track])

    // Attach to video element
    videoElement.srcObject = stream

    // Play video
    videoElement.play().catch((err) => {
      console.error('Error playing consumer track:', err)
    })
  }

  // ==========================================================================
  // Producer Functions
  // ==========================================================================

  async function produceAudio(transport: Transport, stream: MediaStream): Promise<Producer | null> {
    if (!stream) return null

    try {
      const audioTrack = stream.getAudioTracks()[0]
      if (!audioTrack) return null

      const producer = await transport.produce({
        track: audioTrack,
        kind: 'audio',
      })

      // Store producer
      const producers = new Map(state.producers)
      producers.set('audio', producer)
      setState((prev) => ({ ...prev, producers }))

      // Add to roomStore
      addProducer('audio', producer)

      // Handle producer pause/resume (mute/unmute)
      producer.on('pause', () => {
        setMuted(true)
      })

      producer.on('resume', () => {
        setMuted(false)
      })

      // Handle producer close
      producer.on('transportclose', () => {
        const producers = new Map(state.producers)
        producers.delete('audio')
        setState((prev) => ({ ...prev, producers }))
      })

      return producer
    } catch (err) {
      console.error('Error producing audio:', err)
      return null
    }
  }

  async function produceVideo(transport: Transport, stream: MediaStream): Promise<Producer | null> {
    if (!stream) return null

    try {
      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) return null

      const producer = await transport.produce({
        track: videoTrack,
        kind: 'video',
      })

      // Store producer
      const producers = new Map(state.producers)
      producers.set('video', producer)
      setState((prev) => ({ ...prev, producers }))

      // Add to roomStore
      addProducer('video', producer)

      // Handle producer pause/resume (camera on/off)
      producer.on('pause', () => {
        setVideoOff(true)
      })

      producer.on('resume', () => {
        setVideoOff(false)
      })

      // Handle producer close
      producer.on('transportclose', () => {
        const producers = new Map(state.producers)
        producers.delete('video')
        setState((prev) => ({ ...prev, producers }))
      })

      return producer
    } catch (err) {
      console.error('Error producing video:', err)
      return null
    }
  }

  // ==========================================================================
  // Replace Track Function
  // ==========================================================================

  async function replaceTrack(kind: 'audio' | 'video', newTrack: MediaStreamTrack): Promise<boolean> {
    const producer = state.producers.get(kind)
    if (!producer) return false

    try {
      await producer.replaceTrack({ track: newTrack })
      return true
    } catch (err) {
      console.error(`Error replacing ${kind} track:`, err)
      return false
    }
  }

  // ==========================================================================
  // Mute/Unmute Functions
  // ==========================================================================

  async function toggleAudio(): Promise<boolean> {
    const producer = state.producers.get('audio')
    if (!producer) return false

    try {
      if (producer.paused) {
        await producer.resume()
        setMuted(false)
      } else {
        await producer.pause()
        setMuted(true)
      }
      return true
    } catch (err) {
      console.error('Error toggling audio:', err)
      return false
    }
  }

  async function toggleVideo(): Promise<boolean> {
    const producer = state.producers.get('video')
    if (!producer) return false

    try {
      if (producer.paused) {
        await producer.resume()
        setVideoOff(false)
      } else {
        await producer.pause()
        setVideoOff(true)
      }
      return true
    } catch (err) {
      console.error('Error toggling video:', err)
      return false
    }
  }

  // ==========================================================================
  // Speaker Detection
  // ==========================================================================

  // Note: Speaker detection should be implemented in the VideoCard component
  // that renders each consumer. The VideoCard component should call:
  //
  // useSpeakerDetection({
  //   audioTrack: consumer.track,
  //   onSpeakerDetected: () => setActiveSpeakerId(userId),
  //   threshold: -60,
  //   debounceMs: 1000
  // })
  //
  // This ensures each consumer's audio track is monitored independently
  // and the activeSpeakerId is updated in roomStore when someone speaks.

  return {
    // State
    device: state.device,
    sendTransport: state.sendTransport,
    recvTransport: state.recvTransport,
    producers: state.producers,
    consumers: state.consumers,
    isLoading,
    error,

    // Functions
    toggleAudio,
    toggleVideo,
    replaceTrack,
    createConsumer,
    attachConsumerTrack,
  }
}
