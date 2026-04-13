import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRoomStore } from '@/store/roomStore'
import type { ChatMessage, Participant } from '@/store/roomStore'

// ============================================================================
// Socket.IO client mock (hoisted so references are available in factory)
// ============================================================================

const mockEmit = vi.hoisted(() => vi.fn())
const mockSocketIoOn = vi.hoisted(() => vi.fn())

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    connected: true,
    on: vi.fn(),
    emit: mockEmit,
    io: {
      on: mockSocketIoOn,
    },
    disconnect: vi.fn(),
  })),
}))

// ============================================================================
// Reconnection Handling Tests
// ============================================================================
// These tests verify the deduplication and state management guarantees
// that make reconnection safe (no ghost participants, no duplicate messages).

describe('Reconnection Handling', () => {
  beforeEach(() => {
    useRoomStore.getState().reset()
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // reconnect event triggers request-state-sync (socket client behavior)
  // --------------------------------------------------------------------------

  describe('reconnect event triggers request-state-sync emission', () => {
    it('calls socket.emit with request-state-sync on reconnect', async () => {
      // Capture the reconnect callback registered via socket.io.on
      let reconnectCallback: ((attemptNumber: number) => void) | null = null
      mockSocketIoOn.mockImplementation((event: string, cb: (n: number) => void) => {
        if (event === 'reconnect') {
          reconnectCallback = cb
        }
      })

      const { connectToRoom } = await import('@/lib/socket')
      connectToRoom('test-room-reconnect')

      // Simulate reconnect event firing
      expect(reconnectCallback).not.toBeNull()
      if (reconnectCallback) {
        reconnectCallback(2)
        expect(mockEmit).toHaveBeenCalledWith('request-state-sync', { roomId: 'test-room-reconnect' })
      }
    })
  })

  // --------------------------------------------------------------------------
  // Message deduplication
  // --------------------------------------------------------------------------

  describe('addMessage prevents duplicates on reconnection', () => {
    it('adds a new message to the store', () => {
      const msg: ChatMessage = {
        messageId: 'msg-1',
        userId: 'user-1',
        userName: 'Alice',
        message: 'Hello',
        timestamp: new Date().toISOString(),
      }
      useRoomStore.getState().addMessage(msg)
      expect(useRoomStore.getState().messages).toHaveLength(1)
    })

    it('does not add a duplicate message with the same messageId', () => {
      const msg: ChatMessage = {
        messageId: 'msg-1',
        userId: 'user-1',
        userName: 'Alice',
        message: 'Hello',
        timestamp: new Date().toISOString(),
      }
      useRoomStore.getState().addMessage(msg)
      // Simulate reconnect: server re-delivers the same message
      useRoomStore.getState().addMessage(msg)
      expect(useRoomStore.getState().messages).toHaveLength(1)
    })

    it('handles multiple reconnection cycles without duplicate messages', () => {
      const msg: ChatMessage = {
        messageId: 'msg-cycle',
        userId: 'user-1',
        userName: 'Alice',
        message: 'Cycle message',
        timestamp: new Date().toISOString(),
      }
      // Simulate 3 reconnection cycles re-delivering the same message
      for (let i = 0; i < 3; i++) {
        useRoomStore.getState().addMessage(msg)
      }
      expect(useRoomStore.getState().messages).toHaveLength(1)
    })
  })

  // --------------------------------------------------------------------------
  // setMessages deduplication (chat history sync on reconnect)
  // --------------------------------------------------------------------------

  describe('setMessages merges without duplicates', () => {
    it('merges new messages with existing ones without duplicates', () => {
      const existing: ChatMessage = {
        messageId: 'msg-existing',
        userId: 'user-1',
        userName: 'Alice',
        message: 'Before reconnect',
        timestamp: new Date().toISOString(),
      }
      useRoomStore.getState().addMessage(existing)

      // Server sends history that includes the already-known message plus a new one
      const history: ChatMessage[] = [
        existing,
        {
          messageId: 'msg-new',
          userId: 'user-2',
          userName: 'Bob',
          message: 'After reconnect',
          timestamp: new Date().toISOString(),
        },
      ]

      useRoomStore.getState().setMessages(history)

      const messages = useRoomStore.getState().messages
      expect(messages).toHaveLength(2)
      expect(messages.map((m) => m.messageId)).toEqual(['msg-existing', 'msg-new'])
    })

    it('appends only truly new messages when all history is already known', () => {
      const msgs: ChatMessage[] = [
        { messageId: 'msg-1', userId: 'u1', userName: 'Alice', message: 'A', timestamp: new Date().toISOString() },
        { messageId: 'msg-2', userId: 'u2', userName: 'Bob', message: 'B', timestamp: new Date().toISOString() },
      ]
      msgs.forEach((m) => useRoomStore.getState().addMessage(m))

      // setMessages called with same history again (e.g. second reconnect)
      useRoomStore.getState().setMessages(msgs)

      expect(useRoomStore.getState().messages).toHaveLength(2)
    })
  })

  // --------------------------------------------------------------------------
  // Participant deduplication
  // --------------------------------------------------------------------------

  describe('addParticipant prevents duplicate userIds', () => {
    it('adds a participant to the store', () => {
      const p: Participant = { userId: 'user-1', userName: 'Alice' }
      useRoomStore.getState().addParticipant(p)
      expect(useRoomStore.getState().participants).toHaveLength(1)
      expect(useRoomStore.getState().participantCount).toBe(1)
    })

    it('does not add a participant with a duplicate userId', () => {
      const p: Participant = { userId: 'user-1', userName: 'Alice' }
      useRoomStore.getState().addParticipant(p)
      // Simulate reconnect: server emits user-joined again for same user
      useRoomStore.getState().addParticipant(p)
      expect(useRoomStore.getState().participants).toHaveLength(1)
      expect(useRoomStore.getState().participantCount).toBe(1)
    })

    it('handles multiple reconnection cycles without ghost participants', () => {
      const p: Participant = { userId: 'user-ghost', userName: 'Ghost' }
      // Simulate 4 reconnection cycles each emitting user-joined
      for (let i = 0; i < 4; i++) {
        useRoomStore.getState().addParticipant(p)
      }
      expect(useRoomStore.getState().participants).toHaveLength(1)
    })
  })

  // --------------------------------------------------------------------------
  // reset clears all state after disconnect
  // --------------------------------------------------------------------------

  describe('reset clears all state after disconnect', () => {
    it('resets all fields to initial values', () => {
      // Populate store
      useRoomStore.getState().setRoomId('room-123')
      useRoomStore.getState().addParticipant({ userId: 'u1', userName: 'Alice' })
      useRoomStore.getState().addMessage({
        messageId: 'msg-1',
        userId: 'u1',
        userName: 'Alice',
        message: 'Hi',
        timestamp: new Date().toISOString(),
      })
      useRoomStore.getState().setConnected(true)

      // Disconnect
      useRoomStore.getState().reset()

      const state = useRoomStore.getState()
      expect(state.roomId).toBeNull()
      expect(state.participants).toHaveLength(0)
      expect(state.participantCount).toBe(0)
      expect(state.messages).toHaveLength(0)
      expect(state.isConnected).toBe(false)
    })

    it('allows fresh state to be populated after reset', () => {
      useRoomStore.getState().addParticipant({ userId: 'u1', userName: 'Alice' })
      useRoomStore.getState().reset()

      // After reset, new participant should be added cleanly
      useRoomStore.getState().addParticipant({ userId: 'u2', userName: 'Bob' })
      expect(useRoomStore.getState().participants).toHaveLength(1)
      expect(useRoomStore.getState().participants[0].userId).toBe('u2')
    })
  })
})
