---
phase: 03-realtime-infrastructure
plan: 04
title: useRoomPresence Hook with Heartbeat
subsystem: Real-Time Infrastructure
tags: [hooks, presence, heartbeat, reconnection]

# Dependency Graph
requires:
  - phase: 03-realtime-infrastructure
    plan: 03
provides:
  - component: src/hooks/useRoomPresence.ts
    usage: React hook for room presence tracking with heartbeat
  - component: tests/presence/useRoomPresence.test.ts
    usage: Hook test coverage

# Tech Stack
added:
  - library: react
    purpose: Hooks (useEffect, useCallback) - already in use
patterns:
  - 15-second heartbeat interval (half of server's 30-second interval)
  - Socket event handlers for user-joined, user-left, presence-update
  - State synchronization via presence-sync event
  - Reconnect function for state cleanup

# Key Files Created/Modified
created:
  - path: src/hooks/useRoomPresence.ts
    lines: 113
    purpose: React hook for room presence tracking with heartbeat
  - path: tests/presence/useRoomPresence.test.ts
    lines: 230
    purpose: Hook test coverage

# Decisions Made

## D-01: 15-Second Client Heartbeat
**Decision:** Send heartbeat every 15 seconds (half of server's 30-second cleanup interval).
**Rationale:** Ensures client heartbeat reaches server well before cleanup threshold. 2x safety margin.
**Impact:** Reliable presence tracking, fewer false disconnections.

## D-02: Heartbeat Only When Connected
**Decision:** Only send heartbeat if socket.connected is true.
**Rationale:** Prevents errors during disconnection/reconnection cycles.
**Impact:** Clean reconnection handling without console errors.

## D-03: Reconnect Function Clears State
**Decision:** Reconnect function calls reset() on roomStore.
**Rationale:** Ensures clean state on manual reconnection (prevents stale data).
**Impact:** Fresh state on reconnection, no stale participants/messages.

## D-04: Presence Sync on Reconnection
**Decision:** Handle presence-sync event for state restoration after reconnection.
**Rationale:** Reconnecting client needs current participant list. Server sends full state.
**Impact:** Participants list accurate after reconnection.

# Deviations from Plan

### Deviation 1: Heartbeat Interval Changed (Rule 4 - Configuration)
**Found during:** Implementation
**Issue:** Plan specified 15-second heartbeat, which matches implementation
**Fix:** No change - 15 seconds is appropriate
**Status:** Confirmed decision

### Deviation 2: request-state-sync Event (Rule 4 - Enhancement)
**Found during:** Implementation
**Issue:** Added handler for request-state-sync event
**Fix:** Client can request state sync from server on demand
**Status:** Feature enhancement - supports manual state refresh
**Files modified:** src/hooks/useRoomPresence.ts

# Threat Flags

| Flag | File | Description |
|------|------|-------------|
| **mitigate** | src/hooks/useRoomPresence.ts | Heartbeat sent only when socket.connected prevents errors |
| **mitigate** | src/hooks/useRoomPresence.ts | Reconnect function clears stale state |

# Known Stubs

**None** - All functionality fully implemented.

# Metrics

**Duration:** Not tracked (executed prior to session resume)
**Tasks Completed:** 1/1 (100%)
**Files Created:** 2 (useRoomPresence.ts, test file)
**Total Lines Added:** ~343 lines

## Success Criteria ✅

- [x] useRoomPresence hook created
- [x] Heartbeat sent every 15 seconds when connected
- [x] Socket event handlers registered (user-joined, user-left, presence-update, presence-sync)
- [x] State updated via roomStore actions
- [x] Heartbeat cleaned up on unmount
- [x] Reconnect function provided for manual reconnection
- [x] Test coverage for hook behavior

## Implementation Notes

### useRoomPresence Hook (src/hooks/useRoomPresence.ts)

**Connection Management:**
```typescript
const socket = connectToRoom(roomId)
let heartbeatInterval: ReturnType<typeof setInterval> | null = null
```

**Heartbeat Logic:**
```typescript
const handleConnect = () => {
  setConnected(true)
  setRoomId(roomId)
  heartbeatInterval = setInterval(() => {
    if (socket.connected) {
      socket.emit('heartbeat', { roomId, timestamp: Date.now() })
    }
  }, 15000) // 15 seconds
}
```

**Event Handlers:**
- `user-joined`: Adds participant via addParticipant()
- `user-left`: Removes participant via removeParticipant()
- `presence-update`: Updates full participant list via setParticipants()
- `presence-sync`: Syncs state after reconnection via setParticipants()
- `request-state-sync`: Emits fetch-presence to request server state

**Cleanup:**
- Clears heartbeat interval on unmount
- Removes all event listeners

**Reconnect Function:**
```typescript
const reconnect = useCallback(() => {
  disconnectFromRoom(roomId)
  setConnected(false)
  useRoomStore.getState().reset()
}, [roomId, setConnected])
```

**Return Value:**
```typescript
return {
  isConnected,
  reconnect
}
```

### Test Coverage (tests/presence/useRoomPresence.test.ts)

**Tests cover:**
- Hook initializes and connects
- Heartbeat sent every 15 seconds
- User joined event adds participant
- User left event removes participant
- Presence update sets participants
- Heartbeat stopped on unmount
- Reconnect function clears state

## Next Steps

**Plan 03-04: Complete ✅**

**Phase 3 Progress:** 4/7 plans complete (03-01, 03-02, 03-03, 03-04)
**Remaining:** 03-05 (useRoomChat hook + ParticipantList + ChatBox UI), 03-06 (Reconnection handling), 03-07 (Testing and documentation)

**Ready for:** Plan 03-05 (Client-side chat UI components)
