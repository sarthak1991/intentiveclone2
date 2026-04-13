'use client'
import { useState, useEffect, useRef } from 'react'
import { useRoomStore } from '@/store/roomStore'
import { useRoomChat } from '@/hooks/useRoomChat'
import { format } from 'date-fns'

interface ChatBoxProps {
  roomId: string
}

export function ChatBox({ roomId }: ChatBoxProps) {
  const { messages, isConnected } = useRoomStore()
  const { sendMessage } = useRoomChat(roomId)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const trimmed = inputValue.trim()
    if (trimmed && isConnected) {
      sendMessage(trimmed)
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm text-center">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => (
            <div key={msg.messageId} className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">{msg.userName}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(msg.timestamp), 'h:mm a')}
                </span>
              </div>
              <p className="text-sm text-gray-700 mt-0.5">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isConnected ? 'Type a message...' : 'Connecting...'}
            disabled={!isConnected}
            className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || !isConnected}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
        {inputValue.length > 400 && (
          <p className="text-xs text-gray-500 mt-1">{inputValue.length}/500 characters</p>
        )}
      </div>
    </div>
  )
}
