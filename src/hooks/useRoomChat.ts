import { useEffect, useCallback } from 'react'
import { connectToRoom } from '@/lib/socket'
import { useRoomStore } from '@/store/roomStore'
import type { ChatMessage } from '@/store/roomStore'

export function useRoomChat(roomId: string) {
  const { addMessage, setMessages, isConnected } = useRoomStore()

  useEffect(() => {
    if (!isConnected) return

    const socket = connectToRoom(roomId)

    // Fetch chat history on mount
    ;(socket as any).emit('fetch-history', { limit: 50 })

    const handleHistory = (data: { messages: ChatMessage[] }) => {
      setMessages(data.messages)
    }

    const handleMessage = (data: ChatMessage) => {
      addMessage(data)
    }

    const handleError = (data: { error: string }) => {
      console.error('[useRoomChat] Chat error:', data.error)
    }

    ;(socket as any).on('chat-history', handleHistory)
    ;(socket as any).on('chat-message', handleMessage)
    ;(socket as any).on('chat-error', handleError)

    return () => {
      ;(socket as any).off('chat-history', handleHistory)
      ;(socket as any).off('chat-message', handleMessage)
      ;(socket as any).off('chat-error', handleError)
    }
  }, [roomId, isConnected, addMessage, setMessages])

  const sendMessage = useCallback(
    (message: string) => {
      if (!isConnected) return
      const socket = connectToRoom(roomId)
      socket.emit('chat-message', { message })
    },
    [roomId, isConnected]
  )

  return { sendMessage }
}
