import { describe, it, expect, beforeEach } from 'vitest'
import { useRoomStore } from '@/store/roomStore'
import type { Participant, ChatMessage } from '@/store/roomStore'

// Helper to reset store between tests
function resetStore() {
  useRoomStore.getState().reset()
}

describe('RoomStore', () => {
  beforeEach(() => {
    resetStore()
  })

  // ─── Initial State ─────────────────────────────────────────────────────────

  it('has correct initial state', () => {
    const state = useRoomStore.getState()
    expect(state.roomId).toBeNull()
    expect(state.participants).toEqual([])
    expect(state.participantCount).toBe(0)
    expect(state.messages).toEqual([])
    expect(state.isConnected).toBe(false)
  })

  // ─── setRoomId ─────────────────────────────────────────────────────────────

  it('setRoomId updates roomId', () => {
    useRoomStore.getState().setRoomId('room-123')
    expect(useRoomStore.getState().roomId).toBe('room-123')
  })

  // ─── addParticipant ────────────────────────────────────────────────────────

  it('addParticipant adds a participant and increments count', () => {
    const participant: Participant = { userId: 'u1', userName: 'Alice' }
    useRoomStore.getState().addParticipant(participant)

    const state = useRoomStore.getState()
    expect(state.participants).toHaveLength(1)
    expect(state.participants[0]).toEqual(participant)
    expect(state.participantCount).toBe(1)
  })

  it('addParticipant prevents duplicate userIds', () => {
    const participant: Participant = { userId: 'u1', userName: 'Alice' }
    useRoomStore.getState().addParticipant(participant)
    useRoomStore.getState().addParticipant(participant)

    const state = useRoomStore.getState()
    expect(state.participants).toHaveLength(1)
    expect(state.participantCount).toBe(1)
  })

  it('addParticipant adds multiple distinct participants', () => {
    useRoomStore.getState().addParticipant({ userId: 'u1', userName: 'Alice' })
    useRoomStore.getState().addParticipant({ userId: 'u2', userName: 'Bob' })

    const state = useRoomStore.getState()
    expect(state.participants).toHaveLength(2)
    expect(state.participantCount).toBe(2)
  })

  // ─── removeParticipant ─────────────────────────────────────────────────────

  it('removeParticipant removes a participant and decrements count', () => {
    useRoomStore.getState().addParticipant({ userId: 'u1', userName: 'Alice' })
    useRoomStore.getState().removeParticipant('u1')

    const state = useRoomStore.getState()
    expect(state.participants).toHaveLength(0)
    expect(state.participantCount).toBe(0)
  })

  it('removeParticipant handles non-existent userId gracefully', () => {
    useRoomStore.getState().addParticipant({ userId: 'u1', userName: 'Alice' })
    useRoomStore.getState().removeParticipant('nonexistent')

    const state = useRoomStore.getState()
    expect(state.participants).toHaveLength(1)
    expect(state.participantCount).toBe(1)
  })

  it('removeParticipant count never goes below 0', () => {
    useRoomStore.getState().removeParticipant('nonexistent')
    expect(useRoomStore.getState().participantCount).toBe(0)
  })

  // ─── setParticipants ───────────────────────────────────────────────────────

  it('setParticipants replaces entire participant list and updates count', () => {
    useRoomStore.getState().addParticipant({ userId: 'u1', userName: 'Alice' })

    const newList: Participant[] = [
      { userId: 'u2', userName: 'Bob' },
      { userId: 'u3', userName: 'Carol' },
    ]
    useRoomStore.getState().setParticipants(newList)

    const state = useRoomStore.getState()
    expect(state.participants).toHaveLength(2)
    expect(state.participantCount).toBe(2)
    expect(state.participants[0].userId).toBe('u2')
  })

  // ─── addMessage ────────────────────────────────────────────────────────────

  it('addMessage adds to messages array', () => {
    const msg: ChatMessage = {
      messageId: 'msg-1',
      userId: 'u1',
      userName: 'Alice',
      message: 'Hello!',
      timestamp: new Date().toISOString(),
    }
    useRoomStore.getState().addMessage(msg)

    const state = useRoomStore.getState()
    expect(state.messages).toHaveLength(1)
    expect(state.messages[0]).toEqual(msg)
  })

  it('addMessage deduplicates by messageId', () => {
    const msg: ChatMessage = {
      messageId: 'msg-1',
      userId: 'u1',
      userName: 'Alice',
      message: 'Hello!',
      timestamp: new Date().toISOString(),
    }
    useRoomStore.getState().addMessage(msg)
    useRoomStore.getState().addMessage(msg)

    expect(useRoomStore.getState().messages).toHaveLength(1)
  })

  // ─── setMessages ───────────────────────────────────────────────────────────

  it('setMessages replaces messages with deduplication', () => {
    const existing: ChatMessage = {
      messageId: 'msg-1',
      userId: 'u1',
      userName: 'Alice',
      message: 'First',
      timestamp: new Date().toISOString(),
    }
    useRoomStore.getState().addMessage(existing)

    const incoming: ChatMessage[] = [
      existing, // duplicate
      { messageId: 'msg-2', userId: 'u2', userName: 'Bob', message: 'Second', timestamp: new Date().toISOString() },
    ]
    useRoomStore.getState().setMessages(incoming)

    const state = useRoomStore.getState()
    expect(state.messages).toHaveLength(2) // msg-1 (existing) + msg-2 (new)
    expect(state.messages.map((m) => m.messageId)).toContain('msg-1')
    expect(state.messages.map((m) => m.messageId)).toContain('msg-2')
  })

  // ─── setConnected ──────────────────────────────────────────────────────────

  it('setConnected updates connection status', () => {
    useRoomStore.getState().setConnected(true)
    expect(useRoomStore.getState().isConnected).toBe(true)

    useRoomStore.getState().setConnected(false)
    expect(useRoomStore.getState().isConnected).toBe(false)
  })

  // ─── reset ─────────────────────────────────────────────────────────────────

  it('reset clears all state to initial values', () => {
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

    useRoomStore.getState().reset()

    const state = useRoomStore.getState()
    expect(state.roomId).toBeNull()
    expect(state.participants).toEqual([])
    expect(state.participantCount).toBe(0)
    expect(state.messages).toEqual([])
    expect(state.isConnected).toBe(false)
  })
})
