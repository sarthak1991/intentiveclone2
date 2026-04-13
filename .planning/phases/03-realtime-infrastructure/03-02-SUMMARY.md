---
phase: 03-realtime-infrastructure
plan: 02
title: ChatMessage Model and Rate-Limited Chat Handlers
subsystem: Real-Time Infrastructure
tags: [chat, rate-limiting, persistence, validation]

# Dependency Graph
requires:
  - phase: 03-realtime-infrastructure
    plan: 01
provides:
  - component: src/models/ChatMessage.ts
    usage: Chat message persistence schema
  - component: server/socket-server.ts
    usage: Updated Socket.IO server with chat event handlers

# Tech Stack
added:
  - library: mongoose
    purpose: ChatMessage model (already in use from Phase 1)
  - library: zod
    purpose: Message validation (already in use from Phase 2)
patterns:
  - ChatMessage schema with roomId, userId, userName, userPhoto, message, timestamp
  - Compound index { roomId: 1, timestamp: -1 } for efficient queries
  - Rate limiting: max 10 messages/minute via countDocuments
  - Zod schema validation (min 1, max 500 chars)
  - Save to MongoDB BEFORE broadcasting (prevents phantom messages)

# Key Files Created/Modified
created:
  - path: src/models/ChatMessage.ts
    lines: 47
    purpose: Chat message persistence schema
  - path: tests/chat/chat-integration.test.ts
    lines: 290
    purpose: Chat integration tests
  - path: tests/chat/useRoomChat.test.ts
    lines: 180
    purpose: useRoomChat hook tests
modified:
  - path: server/socket-server.ts
    lines: 400+
    purpose: Added chat event handlers with rate limiting
  - path: src/models/types.ts
    purpose: Added IChatMessage interface
  - path: src/models/index.ts
    purpose: Added ChatMessage exports

# Decisions Made

## D-01: Message Max Length 500 Characters
**Decision:** Enforce 500 character limit on chat messages.
**Rationale:** Prevents spam and reduces MongoDB storage costs while allowing meaningful conversation.
**Impact:** Zod validation + Mongoose maxlength enforcement.

## D-02: Save Before Broadcast Pattern
**Decision:** Save to MongoDB FIRST, then broadcast to room.
**Rationale:** Prevents "phantom messages" that appear in chat but fail to persist. On DB error, emit chat-error instead.
**Impact:** Message persistence is guaranteed before delivery.

## D-03: 10 Messages/Minute Rate Limit
**Decision:** Max 10 messages per minute per user.
**Rationale:** Prevents chat spam while allowing normal conversation flow.
**Impact:** countDocuments query with 1-minute rolling window.

## D-04: Overflow Room Chat Sharing
**Decision:** Forward chat messages between main and overflow rooms.
**Rationale:** Per Phase 4 D-12, participants in both rooms should see each other's messages.
**Impact:** Chat messages broadcast to both main and overflow room namespaces.

# Deviations from Plan

### Deviation 1: Chat Tests Renamed (Rule 6 - Naming)
**Found during:** Implementation
**Issue:** Plan specified tests/models/ChatMessage.test.ts and tests/chat/rate-limit.test.ts
**Fix:** Created tests/chat/chat-integration.test.ts and tests/chat/useRoomChat.test.ts instead
**Status:** Naming adjustment - tests organized by feature (chat) rather than layer (model/unit)
**Files created:** tests/chat/chat-integration.test.ts, tests/chat/useRoomChat.test.ts

### Deviation 2: No Separate Rate Limit Test File (Rule 5 - Scope)
**Found during:** Implementation
**Issue:** Rate limiting tests integrated into chat-integration.test.ts
**Fix:** Rate limit tests included in integration suite rather than separate file
**Status:** Organization choice - keeps related tests together
**Files modified:** tests/chat/chat-integration.test.ts

# Threat Flags

| Flag | File | Description |
|------|------|-------------|
| **mitigate** | server/socket-server.ts | T-03-06: Zod schema validation (min 1, max 500 chars) |
| **mitigate** | server/socket-server.ts | T-03-07: Rate limiting prevents spam (10 messages/minute) |
| **mitigate** | server/socket-server.ts | T-03-08: Server-side validation before MongoDB save |
| **mitigate** | server/socket-server.ts | T-03-09: fetch-history only returns messages for user's current room |
| **mitigate** | server/socket-server.ts | T-03-10: Save to MongoDB FIRST, then broadcast |
| **mitigate** | src/models/ChatMessage.ts | T-03-11: Message max length 500 chars prevents storage exhaustion |

# Known Stubs

**None** - All chat functionality fully implemented.

# Metrics

**Duration:** Not tracked (executed prior to session resume)
**Tasks Completed:** 4/4 (100%)
**Files Created:** 3 (ChatMessage model, 2 test files)
**Files Modified:** 3 (socket-server.ts, types.ts, index.ts)
**Total Lines Added:** ~520 lines

## Success Criteria ✅

- [x] ChatMessage model created with proper TypeScript interface
- [x] Compound index on roomId + timestamp for efficient queries
- [x] Message validation enforces 1-500 character limit
- [x] Rate limiting prevents >10 messages/minute per user
- [x] Messages saved to MongoDB before broadcasting
- [x] Chat-error events sent on validation/rate limit failures
- [x] fetch-history returns messages in chronological order
- [x] Overflow room chat sharing implemented
- [x] Test coverage includes validation, rate limiting, and integration

## Implementation Notes

### ChatMessage Model (src/models/ChatMessage.ts)

**Schema Fields:**
- `roomId`: ObjectId reference to Room, indexed
- `userId`: ObjectId reference to User, indexed
- `userName`: String, required
- `userPhoto`: String, optional
- `message`: String, required, maxlength 500
- `timestamp`: Date, indexed, defaults to Date.now
- `createdAt`, `updatedAt`: Automatic timestamps

**Compound Index:**
- `{ roomId: 1, timestamp: -1 }` - Efficient room message queries sorted by time

### Chat Event Handlers (server/socket-server.ts)

**chat-message event:**
1. Validate message with Zod (min 1, max 500 chars)
2. Rate limit check (countDocuments in last 60 seconds)
3. Save to MongoDB with ChatMessage.create()
4. Broadcast to room namespace (include overflow room)
5. Emit chat-error on validation/rate limit failure

**fetch-history event:**
1. Query ChatMessage.find({ roomId })
2. Sort by timestamp descending
3. Limit to 50 messages (configurable)
4. Return in chronological order (reverse)
5. Emit chat-error on query failure

**Rate Limiting Logic:**
```typescript
const recentCount = await ChatMessage.countDocuments({
  userId: user.id,
  timestamp: { $gte: new Date(Date.now() - 60000) }
})
if (recentCount >= 10) {
  socket.emit('chat-error', { error: 'Rate limit exceeded...' })
  return
}
```

**Overflow Room Chat Sharing:**
- Messages in main room forwarded to overflow room
- Messages in overflow room forwarded to main room
- Uses existing room namespace broadcasting

## Next Steps

**Plan 03-02: Complete ✅**

**Ready for:** Plan 03-03 (Zustand roomStore and useSocket hook)
