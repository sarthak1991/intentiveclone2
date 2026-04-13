---
phase: 03-realtime-infrastructure
plan: 03
title: Zustand Room Store and useSocket Hook
subsystem: Real-Time Infrastructure
tags: [state-management, zustand, socket-io, hooks]

# Dependency Graph
requires:
  - phase: 02-room-management
    plan: 02
provides:
  - component: src/store/roomStore.ts
    usage: Zustand store for real-time room state management
  - component: src/hooks/useSocket.ts
    usage: React hook for Socket.IO connection lifecycle

# Tech Stack
added:
  - library: zustand
    purpose: Lightweight state management for room state
patterns:
  - Zustand store with TypeScript for type-safe state management
  - Socket.IO connection lifecycle in React useEffect
  - Connection state tracking (isConnecting, isConnected)
  - Message deduplication by messageId

# Key Files Created/Modified
created:
  - path: src/store/roomStore.ts
    lines: 181
    purpose: Zustand store for real-time room state management
  - path: src/hooks/useSocket.ts
    lines: 83
    purpose: React hook for Socket.IO connection lifecycle

# Decisions Made

## D-01: Zustand Over Redux/Context
**Decision:** Use Zustand for room state management.
**Rationale:** Lightweight, no boilerplate, excellent TypeScript support, simpler than Redux for this use case.
**Impact:** ~180 lines for complete room state vs 500+ with Redux.

## D-02: useSocket Does NOT Disconnect on Unmount
**Decision:** Hook removes listeners on unmount but doesn't disconnect socket.
**Rationale:** Caller decides when to leave room. Allows navigation within room without disconnecting.
**Impact:** Explicit disconnect() function returned by hook.

## D-03: Message Deduplication by messageId
**Decision:** Prevent duplicate messages by messageId in addMessage/setMessages actions.
**Rationale:** Reconnection can cause duplicate messages. Deduplication prevents UI corruption.
**Impact:** Clean message list even after multiple reconnections.

## D-04: WebRTC State in Room Store
**Decision:** Include WebRTC state (isMuted, isVideoOff, activeSpeakerId, producers, consumers) in roomStore.
**Rationale:** Single source of truth for all room-related state. Preparing for Phase 4 WebRTC integration.
**Impact:** Room store serves both Phase 3 (chat/presence) and Phase 4 (WebRTC).

# Deviations from Plan

### Deviation 1: WebRTC State Added to Store (Rule 4 - Forward Planning)
**Found during:** Implementation
**Issue:** Plan specified basic room state, but added WebRTC state for Phase 4 preparation
**Fix:** Added isMuted, isVideoOff, activeSpeakerId, producers, consumers, removeConsumer to store
**Status:** Feature enhancement - Phase 4 WebRTC integration uses this state
**Files modified:** src/store/roomStore.ts

### Deviation 2: No Separate Test File Specified (Rule 5 - Scope)
**Found during:** Implementation
**Issue:** Plan didn't specify test file for useSocket
**Fix:** Tests integrated into presence/chat test suites
**Status:** Organization choice - hook tested via integration tests
**Files:** tests/presence/useRoomPresence.test.ts

# Threat Flags

| Flag | File | Description |
|------|------|-------------|
| **mitigate** | src/store/roomStore.ts | Message deduplication prevents duplicate messages on reconnection |
| **mitigate** | src/hooks/useSocket.ts | Connection state prevents race conditions during connect/disconnect |

# Known Stubs

**None** - All functionality fully implemented.

# Metrics

**Duration:** Not tracked (executed prior to session resume)
**Tasks Completed:** 2/2 (100%)
**Files Created:** 2
**Total Lines Added:** ~264 lines

## Success Criteria ✅

- [x] Zustand store created with TypeScript interfaces
- [x] Room state includes roomId, participants, messages, isConnected
- [x] WebRTC state included for Phase 4 preparation
- [x] Message deduplication prevents duplicates
- [x] Participant deduplication prevents duplicates
- [x] useSocket hook manages connection lifecycle
- [x] Hook returns isConnected, isConnecting, disconnect
- [x] Hook doesn't disconnect on unmount (caller controls)
- [x] Proper cleanup of event listeners

## Implementation Notes

### Zustand Store (src/store/roomStore.ts)

**Type Definitions:**
```typescript
interface Participant {
  userId: string
  userName: string
  userPhoto?: string
}

interface ChatMessage {
  messageId: string
  userId: string
  userName: string
  userPhoto?: string
  message: string
  timestamp: string
}
```

**Room State:**
- `roomId`: string | null
- `participants`: Participant[]
- `participantCount`: number
- `messages`: ChatMessage[]
- `isConnected`: boolean

**WebRTC State (Phase 4 preparation):**
- `isMuted`: boolean
- `isVideoOff`: boolean
- `activeSpeakerId`: string | null
- `producers`: Map<string, any> - kind -> producer
- `consumers`: Map<string, any[]> - userId -> consumers
- `attendedSessions`: Set<string> - attendance tracking

**Actions:**
- `setRoomId()`, `addParticipant()`, `removeParticipant()`, `setParticipants()`
- `addMessage()`, `setMessages()` - with deduplication
- `setConnected()`, `reset()`
- `setMuted()`, `setVideoOff()`, `setActiveSpeakerId()`
- `addProducer()`, `addConsumer()`, `removeConsumer()`
- `setAttendedSession()`

**Deduplication Logic:**
```typescript
addMessage: (message) =>
  set((state) => {
    const exists = state.messages.some((m) => m.messageId === message.messageId)
    if (exists) return state
    return { messages: [...state.messages, message] }
  })
```

### useSocket Hook (src/hooks/useSocket.ts)

**Connection Management:**
- Connects on mount if not already connected to room
- Checks `isConnectedTo(roomId)` to avoid duplicate connections
- Sets `isConnecting` state during connection attempt
- Sets `isConnected` on successful connection

**Event Handlers:**
- `connect`: Sets connected, stops connecting state
- `disconnect`: Clears connected state
- `connect_error`: Logs error, clears states

**Cleanup:**
- Removes event listeners on unmount
- Does NOT disconnect socket (caller controls disconnection)
- Returns `disconnect()` function for explicit disconnection

**Usage Pattern:**
```typescript
const { isConnected, isConnecting, disconnect } = useSocket(roomId)
// Later: disconnect() when user leaves room
```

## Next Steps

**Plan 03-03: Complete ✅**

**Ready for:** Plan 03-04 (useRoomPresence hook)
