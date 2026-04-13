/**
 * Unit tests for useMediaStream hook
 *
 * Tests camera and microphone access with mute/unmute controls.
 * Covers VIDE-02 requirement: User can control own audio mute/unmute.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useMediaStream } from '@/hooks/useMediaStream'
import { toast } from 'sonner'

// Mock Socket.IO
vi.mock('@/lib/socket', () => ({
  socket: {
    emit: vi.fn(),
  },
}))

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

describe('useMediaStream', () => {
  let mockGetUserMedia: ReturnType<typeof vi.fn>
  let mockSocketEvents: Record<string, any[]> = {}

  beforeEach(() => {
    // Mock getUserMedia to return stream by default
    mockGetUserMedia = vi.fn(() =>
      Promise.resolve({
        getAudioTracks: () => [
          {
            id: 'audio-track-1',
            enabled: true,
            kind: 'audio',
            stop: vi.fn(),
          },
        ],
        getVideoTracks: () => [
          {
            id: 'video-track-1',
            enabled: true,
            kind: 'video',
            stop: vi.fn(),
          },
        ],
        getTracks: () => [],
      })
    )

    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: mockGetUserMedia,
      },
      writable: true,
    })

    // Clear socket events
    Object.keys(mockSocketEvents).forEach((key) => {
      delete mockSocketEvents[key]
    })

    vi.clearAllMocks()
  })

  describe('getUserMedia success', () => {
    it('should request camera and microphone access on mount', async () => {
      const { result } = renderHook(() => useMediaStream())

      // Wait for getUserMedia to resolve
      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
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
      })

      // Verify stream is set
      await waitFor(() => {
        expect(result.current.stream).not.toBeNull()
      })
    })

    it('should store audio and video track references', async () => {
      const { result } = renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(result.current.stream).not.toBeNull()
      })

      // Track refs should be set internally (not exposed in hook return)
      // We verify this indirectly by testing toggleAudio/toggleVideo
    })

    it('should initialize with unmuted audio and video on', async () => {
      const { result } = renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(result.current.stream).not.toBeNull()
      })

      expect(result.current.isMuted).toBe(false)
      expect(result.current.isVideoOff).toBe(false)
    })
  })

  describe('toggleAudio', () => {
    it('should toggle mute state and notify server', async () => {
      const { result } = renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(result.current.stream).not.toBeNull()
      })

      // Initial state: not muted
      expect(result.current.isMuted).toBe(false)

      // Toggle to muted
      act(() => {
        result.current.toggleAudio()
      })

      expect(result.current.isMuted).toBe(true)
      // Socket.IO mock is checked via vi.mocked
      const { socket } = await import('@/lib/socket')
      expect(socket.emit).toHaveBeenCalledWith('toggle-audio', { isMuted: true })

      // Toggle back to unmuted
      act(() => {
        result.current.toggleAudio()
      })

      expect(result.current.isMuted).toBe(false)
      expect(socket.emit).toHaveBeenCalledWith('toggle-audio', { isMuted: false })
    })

    it('should disable audio track when muted', async () => {
      const mockAudioTrack = {
        id: 'audio-track-1',
        enabled: true,
        kind: 'audio',
        stop: vi.fn(),
      }

      mockGetUserMedia = vi.fn(() =>
        Promise.resolve({
          getAudioTracks: () => [mockAudioTrack],
          getVideoTracks: () => [],
          getTracks: () => [],
        })
      )

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
      })

      const { result } = renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(result.current.stream).not.toBeNull()
      })

      // Toggle audio to muted
      act(() => {
        result.current.toggleAudio()
      })

      expect(mockAudioTrack.enabled).toBe(false)
      expect(result.current.isMuted).toBe(true)
    })
  })

  describe('toggleVideo', () => {
    it('should toggle video state and notify server', async () => {
      const { result } = renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(result.current.stream).not.toBeNull()
      })

      // Initial state: video on
      expect(result.current.isVideoOff).toBe(false)

      // Toggle to video off
      act(() => {
        result.current.toggleVideo()
      })

      expect(result.current.isVideoOff).toBe(true)
      const { socket } = await import('@/lib/socket')
      expect(socket.emit).toHaveBeenCalledWith('toggle-video', { isVideoOff: true })

      // Toggle back to video on
      act(() => {
        result.current.toggleVideo()
      })

      expect(result.current.isVideoOff).toBe(false)
      expect(socket.emit).toHaveBeenCalledWith('toggle-video', { isVideoOff: false })
    })

    it('should disable video track when video off', async () => {
      const mockVideoTrack = {
        id: 'video-track-1',
        enabled: true,
        kind: 'video',
        stop: vi.fn(),
      }

      mockGetUserMedia = vi.fn(() =>
        Promise.resolve({
          getAudioTracks: () => [],
          getVideoTracks: () => [mockVideoTrack],
          getTracks: () => [],
        })
      )

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
      })

      const { result } = renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(result.current.stream).not.toBeNull()
      })

      // Toggle video to off
      act(() => {
        result.current.toggleVideo()
      })

      expect(mockVideoTrack.enabled).toBe(false)
      expect(result.current.isVideoOff).toBe(true)
    })
  })

  describe('getUserMedia error handling', () => {
    it('should show toast error when permission denied', async () => {
      const error = new Error('Permission denied')
      error.name = 'NotAllowedError'

      mockGetUserMedia = vi.fn(() => Promise.reject(error))

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
      })

      renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Camera and microphone access is required to join a focus room. Please allow access in your browser settings.'
        )
      })
    })

    it('should show generic toast error for other errors', async () => {
      const error = new Error('Device not found')

      mockGetUserMedia = vi.fn(() => Promise.reject(error))

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
      })

      renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          'Could not access camera or microphone. Please check your device permissions.'
        )
      })
    })

    it('should set stream to null on error', async () => {
      mockGetUserMedia = vi.fn(() => Promise.reject(new Error('Error')))

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
      })

      const { result } = renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled()
      })

      expect(result.current.stream).toBeNull()
    })
  })

  describe('cleanup on unmount', () => {
    it('should stop all tracks when component unmounts', async () => {
      const mockAudioTrack = {
        id: 'audio-track-1',
        enabled: true,
        kind: 'audio',
        stop: vi.fn(),
      }

      const mockVideoTrack = {
        id: 'video-track-1',
        enabled: true,
        kind: 'video',
        stop: vi.fn(),
      }

      mockGetUserMedia = vi.fn(() =>
        Promise.resolve({
          getAudioTracks: () => [mockAudioTrack],
          getVideoTracks: () => [mockVideoTrack],
          getTracks: () => [mockAudioTrack, mockVideoTrack],
        })
      )

      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
        writable: true,
      })

      const { result, unmount } = renderHook(() => useMediaStream())

      await waitFor(() => {
        expect(result.current.stream).not.toBeNull()
      })

      // Unmount hook
      unmount()

      // Verify tracks were stopped
      expect(mockAudioTrack.stop).toHaveBeenCalled()
      expect(mockVideoTrack.stop).toHaveBeenCalled()
    })
  })
})
