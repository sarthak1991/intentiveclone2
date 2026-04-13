import { useEffect, useState, useCallback } from 'react'
import { connectToRoom, disconnectFromRoom, isConnectedTo } from '@/lib/socket'
import { useRoomStore } from '@/store/roomStore'
import type { Socket } from '@/lib/socket'

// ============================================================================
// useSocket Hook
// ============================================================================

/**
 * Manages Socket.IO connection lifecycle for a room.
 * Connects on mount, cleans up event listeners on unmount.
 * Does NOT disconnect on unmount — caller decides when to leave room.
 */
export function useSocket(roomId: string | null) {
  const { setConnected, reset } = useRoomStore()
  const [isConnecting, setIsConnecting] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!roomId) return

    // Don't reconnect if already connected to this room
    if (isConnectedTo(roomId)) {
      setConnected(true)
      return
    }

    setIsConnecting(true)

    // Connect to room namespace
    const socketInstance = connectToRoom(roomId)
    setSocket(socketInstance)

    // Connection handlers
    const handleConnect = () => {
      console.log('[useSocket] Connected to room:', roomId)
      setConnected(true)
      setIsConnecting(false)
    }

    const handleDisconnect = () => {
      console.log('[useSocket] Disconnected from room:', roomId)
      setConnected(false)
    }

    const handleConnectError = (error: Error) => {
      console.error('[useSocket] Connection error:', roomId, error)
      setConnected(false)
      setIsConnecting(false)
    }

    socketInstance.on('connect', handleConnect)
    socketInstance.on('disconnect', handleDisconnect)
    socketInstance.on('connect_error', handleConnectError)

    // If already connected at time of hook mount, set state immediately
    if (socketInstance.connected) {
      setConnected(true)
      setIsConnecting(false)
    }

    // Cleanup on unmount — remove listeners but don't disconnect
    return () => {
      socketInstance.off('connect', handleConnect)
      socketInstance.off('disconnect', handleDisconnect)
      socketInstance.off('connect_error', handleConnectError)
    }
  }, [roomId, setConnected])

  const disconnect = useCallback(() => {
    if (roomId) {
      disconnectFromRoom(roomId)
      reset()
      setSocket(null)
    }
  }, [roomId, reset])

  const isConnected = useRoomStore((state) => state.isConnected)

  return {
    socket,
    isConnected,
    isConnecting,
    disconnect,
  }
}
