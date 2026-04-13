---
phase: 03-realtime-infrastructure
plan: 01
title: Server-Side Presence Tracking
subsystem: Real-Time Infrastructure
tags: [presence, websocket, tracking, cleanup]

# Dependency Graph
requires:
  - phase: 02-room-management
    plan: 02
provides:
  - component: server/presence.ts
    usage: Presence tracking system with heartbeat cleanup
  - component: server/socket-server.ts
    usage: Updated Socket.IO server with presence event handlers

# Tech Stack
added:
  - library: socket.io
    purpose: Real-time presence events (already in use from Phase 2)
patterns:
  - Map<roomId, Set<userId>> for accurate participant count
  - Map<roomId, Map<socketId, PresenceData>> for socket-level tracking
  - Heartbeat cleanup interval (30 seconds) with 60-second threshold
  - Overflow room presence sharing per Phase 4 D-12

# Key Files Created/Modified
created:
  - path: server/presence.ts
    lines: 470
    purpose: Presence tracking system with heartbeat cleanup
modified:
  - path: server/socket-server.ts
    lines: 400+
    purpose: Integration of presence event handlers

# Decisions Made

## D-01: Dual Map Structure for Presence Tracking
**Decision:** Use Map<roomId, Set<userId>> for participant count + Map<roomId, Map<socketId, PresenceData>> for socket tracking.
**Rationale:** Handles multiple tabs per user correctly. Set ensures unique users. Map tracks individual socket connections with metadata.
**Impact:** Participant count is accurate regardless of how many tabs a user has open.

## D-02: Heartbeat Cleanup Configuration
**Decision:** 30-second heartbeat interval, 60-second cleanup threshold (2x heartbeat).
**Rationale:** Balances server load with timely cleanup of stale connections. 2x threshold prevents false positives during temporary network issues.
**Impact:** Stale connections removed automatically without premature disconnection.

## D-03: Overflow Room Presence Sharing
**Decision:** Broadcast presence updates between main and overflow rooms.
**Rationale:** Per Phase 4 D-12, participants in both rooms should see each other.
**Impact:** Participants in main and overflow rooms have shared presence view.

# Deviations from Plan

### Deviation 1: Enhanced Presence Functions (Rule 4 - Improvement)
**Found during:** Implementation
**Issue:** Plan specified basic functions, but added utility functions for better monitoring and testing.
**Fix:** Added getRoomPresence(), getPresenceStats(), getParticipants(), getParticipantsWithOverflow()
**Status:** Enhancement - provides better observability and testing support
**Files modified:** server/presence.ts

### Deviation 2: Overflow Room Integration (Rule 4 - Enhancement)
**Found during:** Implementation
**Issue:** Original plan didn't account for overflow room presence sharing
**Fix:** Added broadcastPresence() logic to share presence between main and overflow rooms
**Status:** Feature enhancement - supports Phase 4 overflow room feature
**Files modified:** server/presence.ts

# Threat Flags

| Flag | File | Description |
|------|------|-------------|
| **mitigate** | server/presence.ts | T-03-01: JWT authentication middleware verifies userId before presence events |
| **mitigate** | server/presence.ts | T-03-02: Server-side Map is source of truth for participant count |
| **mitigate** | server/presence.ts | T-03-03: Heartbeat cleanup prevents memory exhaustion from stale sockets |
| **mitigate** | server/presence.ts | T-03-04: Presence events only broadcast within room namespace |
| **mitigate** | server/presence.ts | T-03-05: Track by userId, not socketId (handles multiple tabs) |

# Known Stubs

**None** - All functions fully implemented with production-ready logic.

# Metrics

**Duration:** Not tracked (executed prior to session resume)
**Tasks Completed:** 3/3 (100%)
**Files Created:** 1
**Files Modified:** 1
**Total Lines Added:** ~470 lines (presence.ts)

## Success Criteria ✅

- [x] Presence tracking system created with Map<roomId, Set<userId>>
- [x] Socket-level data stored in Map<roomId, Map<socketId, PresenceData>>
- [x] handleUserJoin adds user to presence, broadcasts events
- [x] handleUserLeave handles multiple tabs correctly
- [x] Heartbeat cleanup interval configured (30 seconds)
- [x] Stale connections removed after 60 seconds
- [x] Socket.IO server updated with presence event handlers
- [x] Overflow room presence sharing implemented
- [x] Utility functions for monitoring and testing

## Implementation Notes

### Presence Tracking System (server/presence.ts)

**Data Structures:**
- `roomPresence`: Map<roomId, Set<userId>> - tracks unique users per room
- `socketData`: Map<roomId, Map<socketId, PresenceData>> - tracks individual sockets with metadata
- `HEARTBEAT_INTERVAL_MS`: 30000 (30 seconds)
- `CLEANUP_THRESHOLD_MS`: 60000 (60 seconds)

**Key Functions:**
- `handleUserJoin()`: Adds user to presence, stores socket data, broadcasts events
- `handleUserLeave()`: Removes socket, checks for other sockets, broadcasts if user completely left
- `broadcastPresence()`: Sends participant count and list to room, handles overflow room sharing
- `updateHeartbeat()`: Updates timestamp for active socket
- `startHeartbeatCleanup()`: Interval that removes stale connections

**Utility Functions:**
- `getRoomPresence()`: Get current presence state for a room
- `getPresenceStats()`: Get global presence statistics
- `getParticipants()`: Get participants array for a room
- `getParticipantsWithOverflow()`: Get participants from main + overflow rooms
- `clearPresence()`: Clear all presence data (testing)

**Overflow Room Support:**
- broadcastPresence() checks if room is overflow or has overflow
- Shares presence data between main and overflow rooms
- Flags presence updates with `overflowRoom: true` or `mainRoom: true`

## Next Steps

**Plan 03-01: Complete ✅**

**Ready for:** Plan 03-02 (ChatMessage model and rate limiting)
