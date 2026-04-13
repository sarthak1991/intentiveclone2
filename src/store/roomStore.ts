import { create } from 'zustand'

// ============================================================================
// Type Definitions
// ============================================================================

export interface Participant {
  userId: string
  userName: string
  userPhoto?: string
}

export interface ChatMessage {
  messageId: string
  userId: string
  userName: string
  userPhoto?: string
  message: string
  timestamp: string
}

export interface Task {
  taskId: string
  taskText: string
  submittedAt: string
  isCompleted: boolean
  completedAt?: string
}

interface RoomState {
  roomId: string | null
  participants: Participant[]
  participantCount: number
  messages: ChatMessage[]
  isConnected: boolean

  // WebRTC state
  isMuted: boolean
  isVideoOff: boolean
  activeSpeakerId: string | null
  producers: Map<string, any> // kind -> producer (audio, video)
  consumers: Map<string, any[]> // userId -> consumers array

  // Attendance tracking (ROOM-08)
  attendedSessions: Set<string>

  // Task state
  currentTask: Task | null
  isTaskCompleted: boolean
  taskCompletedAt: string | null

  // Captain state
  isCaptain: boolean
  captainId: string | null
  mutedParticipants: Set<string>

  // Actions
  setRoomId: (roomId: string) => void
  addParticipant: (participant: Participant) => void
  removeParticipant: (userId: string) => void
  setParticipants: (participants: Participant[]) => void
  addMessage: (message: ChatMessage) => void
  setMessages: (messages: ChatMessage[]) => void
  setConnected: (connected: boolean) => void
  setMuted: (isMuted: boolean) => void
  setVideoOff: (isVideoOff: boolean) => void
  setActiveSpeakerId: (userId: string | null) => void
  addProducer: (kind: string, producer: any) => void
  addConsumer: (userId: string, consumer: any) => void
  removeConsumer: (userId: string, consumerId: string) => void
  setAttendedSession: (sessionId: string) => void
  setCurrentTask: (task: Task | null) => void
  setTaskCompleted: (isCompleted: boolean, completedAt?: string) => void
  clearTask: () => void

  // Captain actions
  setCaptainStatus: (isCaptain: boolean, captainId: string | null) => void
  setParticipantMuted: (userId: string, isMuted: boolean) => void
  muteAll: () => void
  unmuteAll: () => void

  reset: () => void
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useRoomStore = create<RoomState>((set) => ({
  roomId: null,
  participants: [],
  participantCount: 0,
  messages: [],
  isConnected: false,

  // WebRTC state
  isMuted: false,
  isVideoOff: false,
  activeSpeakerId: null,
  producers: new Map(),
  consumers: new Map(),

  // Attendance tracking (ROOM-08)
  attendedSessions: new Set(),

  // Task state
  currentTask: null,
  isTaskCompleted: false,
  taskCompletedAt: null,

  // Captain state
  isCaptain: false,
  captainId: null,
  mutedParticipants: new Set<string>(),

  setRoomId: (roomId) => set({ roomId }),

  addParticipant: (participant) =>
    set((state) => {
      // Prevent duplicate participants
      const exists = state.participants.some((p) => p.userId === participant.userId)
      if (exists) return state

      return {
        participants: [...state.participants, participant],
        participantCount: state.participants.length + 1,
      }
    }),

  removeParticipant: (userId) =>
    set((state) => {
      const filtered = state.participants.filter((p) => p.userId !== userId)
      return {
        participants: filtered,
        participantCount: Math.max(0, filtered.length),
      }
    }),

  setParticipants: (participants) =>
    set({ participants, participantCount: participants.length }),

  addMessage: (message) =>
    set((state) => {
      // Deduplicate by messageId to prevent duplicates on reconnection
      const exists = state.messages.some((m) => m.messageId === message.messageId)
      if (exists) return state

      return {
        messages: [...state.messages, message],
      }
    }),

  setMessages: (messages) =>
    set((state) => {
      // Merge new messages with existing, avoiding duplicates
      const existingIds = new Set(state.messages.map((m) => m.messageId))
      const newMessages = messages.filter((m) => !existingIds.has(m.messageId))

      return {
        messages: [...state.messages, ...newMessages],
      }
    }),

  setConnected: (isConnected) => set({ isConnected }),

  // WebRTC actions
  setMuted: (isMuted) => set({ isMuted }),

  setVideoOff: (isVideoOff) => set({ isVideoOff }),

  setActiveSpeakerId: (activeSpeakerId) => set({ activeSpeakerId }),

  addProducer: (kind, producer) =>
    set((state) => {
      const producers = new Map(state.producers)
      producers.set(kind, producer)
      return { producers }
    }),

  addConsumer: (userId, consumer) =>
    set((state) => {
      const consumers = new Map(state.consumers)
      const userConsumers = consumers.get(userId) || []
      consumers.set(userId, [...userConsumers, consumer])
      return { consumers }
    }),

  removeConsumer: (userId, consumerId) =>
    set((state) => {
      const consumers = new Map(state.consumers)
      const userConsumers = consumers.get(userId) || []
      const filtered = userConsumers.filter((c) => c.id !== consumerId)
      consumers.set(userId, filtered)
      return { consumers }
    }),

  setAttendedSession: (sessionId) =>
    set((state) => {
      const attendedSessions = new Set(state.attendedSessions)
      attendedSessions.add(sessionId)
      return { attendedSessions }
    }),

  // Task actions
  setCurrentTask: (task) =>
    set((state) => {
      // Update current task and sync completion status
      return {
        currentTask: task,
        isTaskCompleted: task?.isCompleted ?? false,
        taskCompletedAt: task?.completedAt ?? null,
      }
    }),

  setTaskCompleted: (isCompleted, completedAt) =>
    set((state) => {
      // Update completion status and optionally update current task
      const updatedTask = state.currentTask
        ? { ...state.currentTask, isCompleted, completedAt }
        : null

      return {
        isTaskCompleted: isCompleted,
        taskCompletedAt: completedAt || null,
        currentTask: updatedTask,
      }
    }),

  clearTask: () =>
    set({
      currentTask: null,
      isTaskCompleted: false,
      taskCompletedAt: null,
    }),

  // Captain actions
  setCaptainStatus: (isCaptain, captainId) =>
    set({
      isCaptain,
      captainId,
    }),

  setParticipantMuted: (userId, isMuted) =>
    set((state) => {
      const mutedParticipants = new Set(state.mutedParticipants)
      if (isMuted) {
        mutedParticipants.add(userId)
      } else {
        mutedParticipants.delete(userId)
      }
      return { mutedParticipants }
    }),

  muteAll: () =>
    set((state) => {
      // Add all current participants to muted set
      const allParticipants = state.participants.map((p) => p.userId)
      return {
        mutedParticipants: new Set(allParticipants),
      }
    }),

  unmuteAll: () =>
    set({
      mutedParticipants: new Set(),
    }),

  reset: () =>
    set({
      roomId: null,
      participants: [],
      participantCount: 0,
      messages: [],
      isConnected: false,
      isMuted: false,
      isVideoOff: false,
      activeSpeakerId: null,
      producers: new Map(),
      consumers: new Map(),
      attendedSessions: new Set(),
      currentTask: null,
      isTaskCompleted: false,
      taskCompletedAt: null,
      isCaptain: false,
      captainId: null,
      mutedParticipants: new Set(),
    }),
}))
