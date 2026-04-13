import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRoomChat } from '@/hooks/useRoomChat'
import { useRoomStore } from '@/store/roomStore'

// ============================================================================
// Mock socket.io-client via the socket module
// ============================================================================

const mockEmit = vi.fn()
const mockOn = vi.fn()
const mockOff = vi.fn()

const mockSocket = {
  emit: mockEmit,
  on: mockOn,
  off: mockOff,
  connected: true,
}

vi.mock('@/lib/socket', () => ({
  connectToRoom: vi.fn(() => mockSocket),
}))

import { connectToRoom } from '@/lib/socket'

// ============================================================================
// Helpers
// ============================================================================

function getHandler(event: string) {
  const calls = mockOn.mock.calls
  const call = calls.find((c) => c[0] === event)
  return call ? call[1] : undefined
}

// ============================================================================
// Tests
// ============================================================================

describe('useRoomChat', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRoomStore.getState().reset()
  })

  afterEach(() => {
    useRoomStore.getState().reset()
  })

  it('does not set up listeners when not connected', () => {
    // isConnected defaults to false after reset
    renderHook(() => useRoomChat('room-1'))

    expect(connectToRoom).not.toHaveBeenCalled()
    expect(mockOn).not.toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('emits fetch-history on mount when connected', () => {
    useRoomStore.setState({ isConnected: true })

    renderHook(() => useRoomChat('room-1'))

    expect(connectToRoom).toHaveBeenCalledWith('room-1')
    expect(mockEmit).toHaveBeenCalledWith('fetch-history', { limit: 50 })
  })

  it('registers chat-history, chat-message, and chat-error listeners', () => {
    useRoomStore.setState({ isConnected: true })

    renderHook(() => useRoomChat('room-1'))

    const events = mockOn.mock.calls.map((c) => c[0])
    expect(events).toContain('chat-history')
    expect(events).toContain('chat-message')
    expect(events).toContain('chat-error')
  })

  it('loads history from chat-history events', () => {
    useRoomStore.setState({ isConnected: true })

    renderHook(() => useRoomChat('room-1'))

    const historyMessages = [
      {
        messageId: 'msg-1',
        userId: 'user-1',
        userName: 'Alice',
        message: 'Hello!',
        timestamp: new Date().toISOString(),
      },
      {
        messageId: 'msg-2',
        userId: 'user-2',
        userName: 'Bob',
        message: 'Hi there!',
        timestamp: new Date().toISOString(),
      },
    ]

    const handleHistory = getHandler('chat-history')
    expect(handleHistory).toBeDefined()

    act(() => {
      handleHistory({ messages: historyMessages })
    })

    const state = useRoomStore.getState()
    expect(state.messages).toHaveLength(2)
    expect(state.messages[0].messageId).toBe('msg-1')
    expect(state.messages[1].messageId).toBe('msg-2')
  })

  it('adds messages from chat-message events', () => {
    useRoomStore.setState({ isConnected: true })

    renderHook(() => useRoomChat('room-1'))

    const newMessage = {
      messageId: 'msg-new',
      userId: 'user-1',
      userName: 'Alice',
      message: 'New message!',
      timestamp: new Date().toISOString(),
    }

    const handleMessage = getHandler('chat-message')
    expect(handleMessage).toBeDefined()

    act(() => {
      handleMessage(newMessage)
    })

    const state = useRoomStore.getState()
    expect(state.messages).toHaveLength(1)
    expect(state.messages[0].messageId).toBe('msg-new')
  })

  it('handles chat-error events gracefully without throwing', () => {
    useRoomStore.setState({ isConnected: true })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    renderHook(() => useRoomChat('room-1'))

    const handleError = getHandler('chat-error')
    expect(handleError).toBeDefined()

    // Should not throw
    expect(() => {
      act(() => {
        handleError({ error: 'Rate limit exceeded' })
      })
    }).not.toThrow()

    expect(consoleSpy).toHaveBeenCalledWith(
      '[useRoomChat] Chat error:',
      'Rate limit exceeded'
    )

    consoleSpy.mockRestore()
  })

  it('sendMessage emits chat-message event when connected', () => {
    useRoomStore.setState({ isConnected: true })

    const { result } = renderHook(() => useRoomChat('room-1'))

    act(() => {
      result.current.sendMessage('Hello world')
    })

    expect(mockEmit).toHaveBeenCalledWith('chat-message', { message: 'Hello world' })
  })

  it('sendMessage does nothing when not connected', () => {
    // isConnected is false by default after reset
    const { result } = renderHook(() => useRoomChat('room-1'))

    act(() => {
      result.current.sendMessage('Hello world')
    })

    // connectToRoom should not be called for sending when disconnected
    // (it may be called in effect, but since isConnected is false the effect bails early)
    const emitCalls = mockEmit.mock.calls.filter((c) => c[0] === 'chat-message')
    expect(emitCalls).toHaveLength(0)
  })

  it('cleans up event listeners on unmount', () => {
    useRoomStore.setState({ isConnected: true })

    const { unmount } = renderHook(() => useRoomChat('room-1'))

    unmount()

    const offEvents = mockOff.mock.calls.map((c) => c[0])
    expect(offEvents).toContain('chat-history')
    expect(offEvents).toContain('chat-message')
    expect(offEvents).toContain('chat-error')
  })
})
