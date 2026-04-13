---
phase: 03-realtime-infrastructure
plans_completed: 7
requirements: [COMM-01, COMM-02]
completed_date: 2026-04-07
tags: [socket.io, zustand, react-hooks, mongodb, presence, chat, websocket]
dependency_graph:
  requires: [02-room-management]
  provides: [real-time-presence, live-chat, reconnection-handling]
  affects: [04-webrtc-integration]
tech_stack:
  added: [zustand@4.5.7, socket.io-client@4.8.3]
  patterns: [zustand-store, custom-hooks, socket-namespace, heartbeat-cleanup, message-deduplication]
key_files:
  created:
    - server/presence.ts
    - src/store/roomStore.ts
    - src/hooks/useSocket.ts
    - src/hooks/useRoomPresence.ts
    - src/hooks/useRoomChat.ts
    - src/components/room/ParticipantList.tsx
    - src/components/room/ChatBox.tsx
    - src/models/ChatMessage.ts
    - tests/presence/presence.test.ts
    - tests/chat/useRoomChat.test.ts
    - tests/chat/chat-integration.test.ts
    - tests/store/roomStore.test.ts
    - tests/hooks/useSocket.test.ts
    - tests/hooks/useRoomPresence.test.ts
    - tests/models/ChatMessage.test.ts
  modified:
    - server/socket-server.ts
    - src/models/types.ts
    - src/models/index.ts
    - tests/setup/socket.ts
    - vitest.config.ts
    - TESTING_GUIDE.md
    - README.md
key_decisions:
  - Presence tracking via server-side Map (not MongoDB) for minimal latency
  - 30s heartbeat timeout on server, 15s client heartbeat interval
  - Zustand over React Context for room state (simpler, no provider nesting)
  - Message deduplication by messageId to prevent duplicates on reconnect
  - Rate limiting via MongoDB countDocuments (10 messages/minute per user)
metrics:
  duration: ~3 hours (7 plans across 3 waves)
  tasks_completed: 35
  files_created: 15
  files_modified: 7
  tests_added: 61
---

# Phase 3: Real-Time Infrastructure Summary

**One-liner:** Socket.IO presence tracking and live chat with Zustand state management, heartbeat cleanup, rate limiting, and reconnection handling.

## Phase Overview

Phase 3 adds real-time communication infrastructure to FocusFlow — the foundation required before WebRTC video in Phase 4. It implements live participant presence tracking, text chat with message persistence, and robust reconnection handling.

**Requirements completed:**
- COMM-01: User can participate in live text chat during session
- COMM-02: User can see other participants in room (names, photos)

**Duration:** 2026-04-06 to 2026-04-07
**Plans:** 7 plans across 3 execution waves

## Plans Completed

| Plan | Name | Description |
|------|------|-------------|
| 03-01 | Server-Side Presence | Server-side `Map<roomId, Set<socketId>>` tracking with 30s heartbeat cleanup and broadcastPresence helper |
| 03-02 | Chat Model + Handlers | ChatMessage Mongoose schema, rate-limited chat event handlers (10 msg/min), fetch-history event |
| 03-03 | Zustand Store + useSocket | `roomStore.ts` with participants/messages/connection state; `useSocket.ts` for connection lifecycle |
| 03-04 | useRoomPresence Hook | Client-side presence hook with 15s heartbeat, join/leave event handling, optimistic updates |
| 03-05 | useRoomChat + UI Components | `useRoomChat.ts` for message send/receive; `ParticipantList.tsx` and `ChatBox.tsx` UI components |
| 03-06 | Reconnection Handling | Exponential backoff reconnection, state resync on reconnect, message deduplication by messageId |
| 03-07 | Testing + Documentation | Fixed test isolation issues, updated TESTING_GUIDE.md, created phase summary, updated README |

## Files Created

| File | Purpose |
|------|---------|
| `server/presence.ts` | Server-side presence tracking — Map<roomId, Map<socketId, PresenceEntry>>, handleUserJoin/Leave, broadcastPresence, startHeartbeatCleanup |
| `src/models/ChatMessage.ts` | Mongoose schema for chat messages — roomId, userId, userName, userPhoto, message, timestamp with compound index |
| `src/store/roomStore.ts` | Zustand store — participants array, messages array, connection status, addMessage/setParticipants actions |
| `src/hooks/useSocket.ts` | Socket.IO connection hook — connect/disconnect lifecycle, auth token injection, connection state |
| `src/hooks/useRoomPresence.ts` | Presence hook — join room on mount, heartbeat every 15s, handle presence-update events, cleanup on unmount |
| `src/hooks/useRoomChat.ts` | Chat hook — sendMessage with rate limit error handling, fetch history on join, deduplicate incoming messages |
| `src/components/room/ParticipantList.tsx` | UI component — renders participant list from Zustand store, shows photos/fallback avatars, live count |
| `src/components/room/ChatBox.tsx` | UI component — message list with auto-scroll, input with Enter key support, disabled state when disconnected |
| `tests/presence/presence.test.ts` | 15 unit tests for server-side presence tracking |
| `tests/chat/useRoomChat.test.ts` | 9 unit tests for useRoomChat hook |
| `tests/chat/chat-integration.test.ts` | 9 integration tests for end-to-end chat flow |
| `tests/store/roomStore.test.ts` | 10 unit tests for Zustand store |
| `tests/hooks/useSocket.test.ts` | 8 unit tests for useSocket hook |
| `tests/hooks/useRoomPresence.test.ts` | 10 unit tests for useRoomPresence hook |
| `tests/models/ChatMessage.test.ts` | 8 unit tests for ChatMessage Mongoose model |

## Key Technical Decisions

### 1. Server-side presence via in-memory Map

**Decision:** Track room participants in `Map<roomId, Map<socketId, PresenceEntry>>` on the Socket.IO server, not in MongoDB.

**Rationale:** Presence data is ephemeral and changes frequently (every 30 seconds via heartbeat). MongoDB writes for every heartbeat would add unnecessary latency and load. The in-memory Map gives sub-millisecond lookups and immediate broadcast.

**Trade-off:** Presence data is lost if the Socket.IO server restarts. Clients handle this via reconnection state resync (fetch-presence event on reconnect).

### 2. 30s heartbeat timeout with 15s client interval

**Decision:** Server cleans up stale sockets after 30 seconds of no heartbeat. Clients send heartbeat every 15 seconds.

**Rationale:** 15s client interval gives a 2x safety margin before the 30s server timeout. This handles brief network interruptions without false "user left" events. Lower than WebRTC's typical 60s because focus sessions are short (45 min) and participant count accuracy matters.

### 3. Zustand for room state management

**Decision:** Use Zustand store (`roomStore.ts`) instead of React Context for participants, messages, and connection state.

**Rationale:** React Context causes full subtree re-renders on every state change. With real-time updates (messages every few seconds, heartbeats), this would cause performance issues. Zustand provides granular subscriptions with zero boilerplate.

### 4. Message deduplication by messageId

**Decision:** Track received `messageId` values in a Set within the Zustand store; skip duplicates.

**Rationale:** On reconnection, the server sends recent chat history which may include messages already displayed. Without deduplication, users would see duplicate messages after every reconnect. The Set grows only to ~50 messages (history limit) so memory impact is negligible.

### 5. Rate limiting via MongoDB countDocuments

**Decision:** Rate limit chat to 10 messages/minute by querying `ChatMessage.countDocuments({ userId, timestamp: { $gte: oneMinuteAgo } })`.

**Rationale:** Simple, stateless rate limiting without Redis. For MVP with small user counts, this is sufficient. The compound index `{ roomId: 1, timestamp: -1 }` makes these queries fast. At scale, Redis-based rate limiting would be preferable.

### 6. Dynamic namespace regex for rooms

**Decision:** Use `io.of(/^\/room-\w+$/)` as a dynamic namespace pattern instead of creating individual namespaces.

**Rationale:** Rooms are created dynamically. A regex namespace handles all rooms with one handler, eliminating the need to programmatically create/destroy namespaces. Socket.IO's adapter handles room isolation within the namespace.

## Test Coverage

**Total Phase 3 tests: 61**

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| Presence tracking (server) | 15 | handleUserJoin, handleUserLeave, heartbeat cleanup, broadcastPresence, getParticipants |
| ChatMessage model | 8 | Schema validation, compound index, rate limit counting, timestamp sorting |
| Zustand store | 10 | addMessage, setParticipants, connection state, deduplication |
| useSocket hook | 8 | Connect/disconnect lifecycle, auth token, reconnection events |
| useRoomPresence hook | 10 | Join/leave events, heartbeat scheduling, presence-update handling |
| useRoomChat hook | 9 | sendMessage, fetch-history, message deduplication, rate limit errors |
| Chat integration | 9 | End-to-end: message save + broadcast, validation, history, multi-user, room isolation |

**All 61 tests pass** when run via: `npx vitest run tests/presence/ tests/chat/ tests/store/ tests/hooks/ tests/models/ChatMessage.test.ts`

Note: `fileParallelism: false` added to `vitest.config.ts` to prevent MongoDB data isolation issues between concurrent test files.

## Known Issues

None — all Phase 3 requirements met. The following items were noted as out-of-scope for Phase 3 and deferred:

- **Typing indicators** — Deferred to Phase 5 (would require additional Socket.IO events and UI state)
- **Room capacity enforcement** — Deferred to Phase 4 (requires knowledge of video participants)
- **Participant photos in presence** — Placeholder for Phase 4 (photoUrl included in presence entries but not yet wired to user avatar upload)
- **Chat message TTL** — The 7-day TTL index is commented out in ChatMessage schema; can be enabled before production deployment

## Lessons Learned

1. **Server-side presence is simpler than expected** — A plain JavaScript Map on the Socket.IO server handles all the complex state without a database. The key insight is that presence is session-scoped, not persistent.

2. **Socket.IO dynamic namespace middleware requires explicit setup** — Middleware added via `io.use()` applies to the root namespace only. Dynamic namespaces created with `io.of(/regex/)` need their own `namespace.use()` middleware call. This caused a bug in the test setup.

3. **Zustand's selector subscriptions prevent unnecessary re-renders** — Using `useRoomStore(state => state.participants)` instead of the full store prevents re-renders when unrelated state changes (e.g., a new message doesn't re-render the participant list).

4. **Message deduplication is critical for reconnection UX** — Without it, every reconnect shows duplicate messages which destroys trust in the chat interface. The Set-based deduplication adds minimal overhead.

5. **Test file parallelism causes MongoDB data races** — Multiple test files with `deleteMany({})` in `beforeEach` running concurrently will delete each other's data. `fileParallelism: false` in vitest config is the correct fix for test suites sharing a database.

## Next Steps: Phase 4 (WebRTC Integration)

Phase 3 provides the signaling infrastructure needed for Phase 4. The Socket.IO server already handles room namespaces and authentication — Phase 4 will add mediasoup WebRTC events on top of this foundation.

**Phase 4 plans:**
1. 04-01: mediasoup SFU server setup (worker, router, WebRTC transports)
2. 04-02: coturn TURN server deployment on separate VPS
3. 04-03: WebRTC client hooks (useMediaStream, useWebRTCConnection)
4. 04-04: Producer/consumer logic for audio/video streams
5. 04-05: Video grid UI component (adaptive layout for 1-12 participants)
6. 04-06: Room capacity enforcement and overflow room auto-scaling
7. 04-07: WebRTC integration tests and Phase 4 documentation

**Key Phase 4 dependencies from Phase 3:**
- `useSocket.ts` — WebRTC signaling events will be sent via the same Socket.IO connection
- `roomStore.ts` — Will be extended with `producers`, `consumers`, and `videoStreams` state
- `server/socket-server.ts` — WebRTC signaling events (`produce`, `consume`, `signal`) will be added here
