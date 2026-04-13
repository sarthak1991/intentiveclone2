import { useEffect, useRef } from 'react'

// ============================================================================
// Type Definitions
// ============================================================================

interface UseSpeakerDetectionOptions {
  audioTrack: MediaStreamTrack | null
  onSpeakerDetected: () => void
  threshold?: number // dB (decibels)
  debounceMs?: number // Minimum time between detections
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * Monitors audio levels from a MediaStreamTrack and detects when someone is speaking
 *
 * @param audioTrack - The audio track to monitor
 * @param onSpeakerDetected - Callback when speaker is detected (audio above threshold)
 * @param threshold - Audio threshold in dB (default: -60 dB)
 * @param debounceMs - Minimum time between detections in ms (default: 1000ms)
 *
 * @example
 * ```tsx
 * useSpeakerDetection(
 *   audioTrack,
 *   () => setActiveSpeakerId(userId),
 *   -60, // threshold
 *   1000 // debounce
 * )
 * ```
 */
export function useSpeakerDetection({
  audioTrack,
  onSpeakerDetected,
  threshold = -60, // dB (decibels)
  debounceMs = 1000, // 1 second default
}: UseSpeakerDetectionOptions) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const lastDetectionTimeRef = useRef<number>(0)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!audioTrack) {
      // Cleanup if track is removed
      cleanup()
      return
    }

    let mounted = true

    // Initialize audio context and analyser
    const initializeAudioContext = async () => {
      try {
        // Create AudioContext
        const audioContext = new AudioContext()
        audioContextRef.current = audioContext

        // Create AnalyserNode
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 256 // Fast FFT for real-time analysis
        analyser.smoothingTimeConstant = 0.8 // Smooth audio level changes
        analyserRef.current = analyser

        // Create MediaStream from track
        const stream = new MediaStream([audioTrack])

        // Create MediaStreamSource
        const source = audioContext.createMediaStreamSource(stream)
        sourceRef.current = source

        // Connect source to analyser
        source.connect(analyser)

        // Start monitoring audio levels
        monitorAudioLevel(analyser)
      } catch (err) {
        console.error('Error initializing speaker detection:', err)
      }
    }

    // Monitor audio levels and detect speaking
    const monitorAudioLevel = (analyser: AnalyserNode) => {
      if (!mounted) return

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const checkAudioLevel = () => {
        if (!mounted || !analyser) return

        // Get frequency data
        analyser.getByteFrequencyData(dataArray)

        // Calculate average volume
        const sum = dataArray.reduce((acc, value) => acc + value, 0)
        const average = sum / dataArray.length

        // Convert to dB (decibels)
        // dB = 20 * log10(amplitude / reference)
        // Reference is 255 (max value for Uint8)
        let dB = -100 // Default silence
        if (average > 0) {
          dB = 20 * Math.log10(average / 255)
        }

        // Detect if speaking (above threshold)
        if (dB > threshold) {
          const now = Date.now()

          // Debounce: Only trigger if enough time has passed
          if (now - lastDetectionTimeRef.current >= debounceMs) {
            lastDetectionTimeRef.current = now
            onSpeakerDetected()
          }
        }

        // Continue monitoring
        animationFrameRef.current = requestAnimationFrame(checkAudioLevel)
      }

      checkAudioLevel()
    }

    // Cleanup function
    const cleanup = () => {
      mounted = false

      // Cancel animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Disconnect source
      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }

      // Close audio context
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close()
        audioContextRef.current = null
      }

      // Clear refs
      analyserRef.current = null
      lastDetectionTimeRef.current = 0
    }

    initializeAudioContext()

    // Cleanup on unmount or when audioTrack changes
    return cleanup
  }, [audioTrack, threshold, debounceMs, onSpeakerDetected])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [])

  // Internal cleanup function
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (sourceRef.current) {
      sourceRef.current.disconnect()
      sourceRef.current = null
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    analyserRef.current = null
    lastDetectionTimeRef.current = 0
  }
}
