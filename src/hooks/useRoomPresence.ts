import { useEffect, useCallback } from 'react'
import { connectToRoom, disconnectFromRoom } from '@/lib/socket'
import { useRoomStore } from '@/store/roomStore'
import type { Socket } from '@/lib/socket'

export function useRoomPresence(roomId: string, socket?: Socket) {
  const {
    setRoomId,
    addParticipant,
    removeParticipant,
    setParticipants,
    setConnected,
    isConnected,
  } = useRoomStore()

  useEffect(() => {
    // Use provided socket or create new connection
    const socketInstance = socket || connectToRoom(roomId)
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null

    const handleConnect = () => {
      setConnected(true)
      setRoomId(roomId)
      // Send heartbeat every 15 seconds to maintain server-side presence
      heartbeatInterval = setInterval(() => {
        if (socketInstance.connected) {
          ;(socketInstance as any).emit('heartbeat', { roomId, timestamp: Date.now() })
        }
      }, 15000)
    }

    const handleDisconnect = () => {
      setConnected(false)
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
      }
    }

    const handleUserJoined = (data: { userId: string; userName: string; userPhoto?: string }) => {
      addParticipant({ userId: data.userId, userName: data.userName, userPhoto: data.userPhoto })
    }

    const handleUserLeft = (data: { userId: string }) => {
      removeParticipant(data.userId)
    }

    const handlePresenceUpdate = (data: {
      participants: Array<{ userId: string; userName: string; userPhoto?: string }>
    }) => {
      setParticipants(
        data.participants.map((p) => ({
          userId: p.userId,
          userName: p.userName,
          userPhoto: p.userPhoto,
        }))
      )
    }

    const handlePresenceSync = (data: {
      participants: Array<{ userId: string; userName: string; userPhoto?: string }>
    }) => {
      setParticipants(
        data.participants.map((p) => ({
          userId: p.userId,
          userName: p.userName,
          userPhoto: p.userPhoto,
        }))
      )
    }

    const handleRequestStateSync = () => {
      ;(socketInstance as any).emit('fetch-presence', { roomId })
    }

    // typed events
    socketInstance.on('user-joined', handleUserJoined)
    socketInstance.on('user-left', handleUserLeft)

    // untyped events — cast to any
    ;(socketInstance as any).on('connect', handleConnect)
    ;(socketInstance as any).on('disconnect', handleDisconnect)
    ;(socketInstance as any).on('presence-update', handlePresenceUpdate)
    ;(socketInstance as any).on('presence-sync', handlePresenceSync)
    ;(socketInstance as any).on('request-state-sync', handleRequestStateSync)

    // If already connected at mount, start heartbeat
    if (socketInstance.connected) {
      handleConnect()
    }

    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval)
      socketInstance.off('user-joined', handleUserJoined)
      socketInstance.off('user-left', handleUserLeft)
      ;(socketInstance as any).off('connect', handleConnect)
      ;(socketInstance as any).off('disconnect', handleDisconnect)
      ;(socketInstance as any).off('presence-update', handlePresenceUpdate)
      ;(socketInstance as any).off('presence-sync', handlePresenceSync)
      ;(socketInstance as any).off('request-state-sync', handleRequestStateSync)

      // Only disconnect if we created the socket (not provided externally)
      if (!socket) {
        disconnectFromRoom(roomId)
      }
    }
  }, [roomId, socket, setRoomId, addParticipant, removeParticipant, setParticipants, setConnected])

  const reconnect = useCallback(() => {
    disconnectFromRoom(roomId)
    setConnected(false)
    useRoomStore.getState().reset()
  }, [roomId, setConnected])

  return {
    isConnected,
    reconnect,
  }
}
