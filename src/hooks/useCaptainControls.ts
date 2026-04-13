import { useState, useEffect, useCallback } from 'react'
import { useRoomStore } from '@/store/roomStore'
import { useSocket } from '@/hooks/useSocket'

export interface TaskCount {
  submitted: number
  total: number
  percentage: number
}

export interface UseCaptainControlsResult {
  isCaptain: boolean
  captainId: string | null
  taskCount: TaskCount | null
  mutedParticipants: Set<string>
  isLoading: boolean
  handleMuteAll: () => void
  handleUnmuteAll: () => void
  handleMuteParticipant: (userId: string) => void
  handleUnmuteParticipant: (userId: string) => void
}

/**
 * Hook for captain controls and mute management.
 * Verifies captain status and provides mute control functions.
 */
export function useCaptainControls(
  roomId: string | null
): UseCaptainControlsResult {
  const socket = useSocket()
  const isCaptain = useRoomStore((state) => state.isCaptain)
  const captainId = useRoomStore((state) => state.captainId))
  const mutedParticipants = useRoomStore((state) => state.mutedParticipants)
  const setCaptainStatus = useRoomStore((state) => state.setCaptainStatus)
  const setParticipantMuted = useRoomStore((state) => state.setParticipantMuted)
  const muteAll = useRoomStore((state) => state.muteAll)
  const unmuteAll = useRoomStore((state) => state.unmuteAll)

  const [taskCount, setTaskCount] = useState<TaskCount | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch captain status on mount
  useEffect(() => {
    if (!roomId) return

    const fetchCaptainStatus = async () => {
      try {
        const response = await fetch(`/api/rooms/${roomId}/captain-status`)
        const data = await response.json()

        if (data.success) {
          setCaptainStatus(data.isCaptain, data.captainId)
        }
      } catch (error) {
        console.error('Error fetching captain status:', error)
      }
    }

    fetchCaptainStatus()
  }, [roomId, setCaptainStatus])

  // Fetch task count when captain
  useEffect(() => {
    if (!roomId || !isCaptain) return

    const fetchTaskCount = async () => {
      try {
        const response = await fetch(`/api/tasks/${roomId}/aggregate`)
        const data = await response.json()

        if (data.success) {
          setTaskCount({
            submitted: data.submitted,
            total: data.total,
            percentage: data.percentage,
          })
        }
      } catch (error) {
        console.error('Error fetching task count:', error)
      }
    }

    fetchTaskCount()

    // Set up Socket.IO listener for real-time updates
    if (socket) {
      const handleTaskSubmitted = () => {
        fetchTaskCount()
      }

      socket.on('task-submitted', handleTaskSubmitted)

      return () => {
        socket.off('task-submitted', handleTaskSubmitted)
      }
    }
  }, [roomId, isCaptain, socket])

  // Mute control functions
  const handleMuteAll = useCallback(() => {
    if (!socket || !roomId) return

    socket.emit('captain-mute-all', { roomId })
    muteAll()
  }, [socket, roomId, muteAll])

  const handleUnmuteAll = useCallback(() => {
    if (!socket || !roomId) return

    socket.emit('captain-unmute-all', { roomId })
    unmuteAll()
  }, [socket, roomId, unmuteAll])

  const handleMuteParticipant = useCallback(
    (userId: string) => {
      if (!socket || !roomId) return

      socket.emit('captain-mute-participant', { roomId, targetUserId: userId })
      setParticipantMuted(userId, true)
    },
    [socket, roomId, setParticipantMuted]
  )

  const handleUnmuteParticipant = useCallback(
    (userId: string) => {
      if (!socket || !roomId) return

      socket.emit('captain-unmute-participant', { roomId, targetUserId: userId })
      setParticipantMuted(userId, false)
    },
    [socket, roomId, setParticipantMuted]
  )

  return {
    isCaptain,
    captainId,
    taskCount,
    mutedParticipants,
    isLoading,
    handleMuteAll,
    handleUnmuteAll,
    handleMuteParticipant,
    handleUnmuteParticipant,
  }
}
