# Phase 4: WebRTC Integration - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Implementing video/audio connectivity for 12-person focus rooms using mediasoup SFU, coturn TURN server, and WebRTC client. This phase delivers reliable video sessions with mute controls, captain permissions, connection resilience, and session timers.

**What this includes:**
- mediasoup 3.19.19 SFU server setup with worker, router, and WebRTC transport management
- coturn TURN server deployment on separate VPS with REST API for dynamic credentials
- WebRTC client hooks (useMediaStream, useWebRTCConnection) and React context for peer management
- Producer/consumer logic for audio/video streams with mediasoup-client
- Video grid UI component with adaptive layout (1-12 participants)
- Audio/video controls (bottom bar, always visible, mute/camera/leave/settings)
- Room capacity enforcement (12 participants) with auto-scaling to 16 with overflow split
- 45-minute session countdown timer
- Attendance validation (90+ seconds in session = attended)
- Comprehensive ICE configuration with multiple STUN/TURN servers

**What this does NOT include:**
- Task submission and accountability flow (Phase 5)
- Gamification and streaks (Phase 5)
- Captain eligibility and invitations (Phase 5)
- Payments and subscriptions (Phase 6)
- Email notifications (Phase 6)
- Admin analytics dashboards (Phase 7)
</domain>

<decisions>
## Implementation Decisions

### Video Grid Layout
- **D-01:** Use **auto-responsive grid** that adapts as people join/leave:
  - 1-3 participants: Full-width rows
  - 4-6 participants: 2x3 grid
  - 7-9 participants: 3x3 grid
  - 10-12 participants: 3x4 grid
  - Smoothly adapts as participants join/leave
- **D-02:** Use **hybrid speaker detection** for border highlight:
  - Automatic: WebRTC audio level detection (loudest speaker gets border)
  - Manual: Users can raise hand to become "active speaker"
  - Captain override: Captain can manually highlight any participant
- **D-03:** Use **simple solid border** for speaker indication:
  - 2px solid accent color (matches shadcn/ui focus rings)
  - No animation (avoid distraction for ADHD users)
  - Border appears around current speaker's video card

### Audio/Video Controls
- **D-04:** Use **bottom control bar** placement (Zoom-style pattern):
  - Fixed bar at bottom of video grid
  - Always visible (no auto-hide)
  - Simpler for ADHD users (don't need to remember where controls are)
- **D-05:** Include **four primary buttons** in control bar:
  - Mute/unmute microphone (required - VIDE-02)
  - Toggle camera on/off
  - Leave/exit room (red button or prominent styling)
  - Settings for audio/video devices (select mic, camera, speaker)
- **D-06:** Use **red background + icon change** for mute visual feedback:
  - Muted state: Button background turns red, icon changes to slashed mic
  - Camera off: Button background turns red, icon changes to slashed camera
  - Clear visual cue that media is disabled
- **D-07:** Implement **captain controls with both options**:
  - Option 1: Captain clicks any participant's video card to mute/unmute them (shows confirmation modal)
  - Option 2: "Mute All" button in control bar (participants can unmute themselves)
  - Maximum flexibility for captains to manage room audio

### Session Countdown Timer
- **D-08:** Display timer as **small sticker on header with accent color**:
  - Placement: Top of screen (header area)
  - Prominent but not obtrusive
  - Accent color for visibility
- **D-09:** Use **"... remaining"** format:
  - Example: "42:15 remaining" or "5:00 remaining"
  - Clear that timer is counting down
  - Less wordy than "Session ends in..."
- **D-10:** Use **no color change** throughout session:
  - Accent color throughout entire 45 minutes
  - No red/orange urgency signals
  - Consistent, less stressful for ADHD users

### Connection Quality UI (Claude's Discretion)
- **D-11:** Use **subtle status indicator** for connection quality:
  - Green/yellow/red dot next to user's own name in the header
  - Small tooltip on hover shows details (bitrate, packet loss, TURN vs direct)
  - No full-screen alerts or intrusive notifications
  - Silent reconnection in background (use existing reconnection handling from Phase 3)
  - Rationale: Minimize distraction and anxiety for ADHD users while providing visibility for troubleshooting

### Overflow Room Experience (from ROOM-07 requirement)
- **D-12:** Implement **auto-scaling to overflow rooms**:
  - First 12 participants: Main room (e.g., "9:00 AM Focus Room")
  - Participants 13-16: Auto-created overflow room (e.g., "9:00 AM Focus Room - Overflow")
  - Both rooms have full video and audio
  - Chat is shared across both rooms (use existing chat infrastructure from Phase 3)
  - Seamless experience - user may not realize they're in overflow

### Attendance Validation (from ROOM-08 requirement)
- **D-13:** Track **90+ seconds in session = attended**:
  - Start timer when user successfully connects to WebRTC room
  - Track time spent in session (disconnect and reconnect don't reset timer)
  - Mark as "attended" when cumulative time >= 90 seconds
  - Used for no-show detection (ADMN-06) and gamification (GAME-01 streak counter)

### TURN Server Deployment (from TECH-05 requirement)
- **D-14:** Deploy **coturn TURN server on separate VPS**:
  - Recommended: 2 vCPU, 2GB RAM (DigitalOcean $12/mo)
  - Bandwidth: 500 Mbps per 50 concurrent video users
  - Required for users behind restrictive NAT/firewalls
  - REST API for dynamic credential generation (security best practice)

### ICE Configuration (from TECH-07 requirement)
- **D-15:** Use **comprehensive ICE configuration** with multiple STUN/TURN servers:
  - Primary: Google's public STUN (stun:stun.l.google.com:19302) - free, works for most
  - TURN: Self-hosted coturn server - relay for restrictive NAT
  - Fallback: Additional STUN servers for redundancy
  - Transport: UDP with TCP/TLS fallback for restrictive firewalls
  - Rationale: Maximize connection success rate (target: 80%+ connectivity)

### Claude's Discretion
- **Grid layout breakpoints**: Choose exact participant count thresholds for responsive behavior (e.g., 1-3, 4-6, 7-9, 10-12)
- **Speaker detection audio threshold**: Set audio level sensitivity for automatic speaker detection (avoid false positives from background noise)
- **Border accent color**: Choose specific accent color from Tailwind palette (consider accessibility - WCAG AA contrast)
- **Connection status icons**: Choose specific icons for connection quality (signal strength, wifi, etc.) from lucide-react
- **Timer placement**: Exact header location (left, center, right) and z-index layering
- **Overflow room naming**: Convention for overflow room names (e.g., "- Overflow" suffix, unique identifier)
- **TURN credential TTL**: Set appropriate expiry time for dynamically generated TURN credentials
- **ICE connection timeout**: How long to wait before declaring connection failed (fallback to error UI)
- **Bandwidth estimation**: How to estimate participant bandwidth for quality adaptation (if implemented)
- **Recording connection metrics**: What to log for debugging (connection type, candidate pair, relay vs direct)
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Video & Audio (WebRTC) — VIDE-01 through VIDE-06: Video connectivity, mute controls, captain permissions, TURN server, 12-person rooms
- `.planning/REQUIREMENTS.md` §Focus Rooms — ROOM-04, ROOM-06, ROOM-07, ROOM-08: Capacity enforcement, countdown timer, overflow split, attendance validation
- `.planning/REQUIREMENTS.md` §Technical Infrastructure — TECH-05, TECH-07: TURN server deployment, ICE configuration
- `.planning/ROADMAP.md` §Phase 4: WebRTC Integration — Phase goal, success criteria, and plan list (7 plans)

### Technology Stack Documentation
- `CLAUDE.md` §Technology Stack → WebRTC Implementation — mediasoup 3.19.19 SFU, coturn TURN server, Socket.IO 4.8.3 signaling
- `CLAUDE.md` §WebRTC Architecture — Why mediasoup over alternatives (Twilio, Jitsi, LiveKit)
- `CLAUDE.md` §STUN/TURN Setup — Google public STUN, coturn on separate VPS, bandwidth estimates

### Existing Code Patterns (Phase 3)
- `src/lib/socket.ts` — Socket.IO client with WebRTC signaling event types already defined (ServerToClientEvents, ClientToServerEvents)
- `src/store/roomStore.ts` — Zustand store for room state (participants, messages, connection status)
- `src/hooks/useSocket.ts` — Socket connection lifecycle management (reconnection handling from Phase 3)
- `src/hooks/useRoomPresence.ts` — Participant presence tracking with heartbeat
- `src/hooks/useRoomChat.ts` — Chat message handling (rate-limited to 10 messages/minute)

### Component Library
- `src/components/ui/` — shadcn/ui components for reuse in video grid and control bar (Button, Badge, Dialog, etc.)
- Tailwind CSS utilities for responsive grid layout and spacing

### Known Risks (from STATE.md)
- WebRTC Connection Failures — 20-40% of users may fail to connect due to NAT/firewall issues (mitigation: comprehensive ICE config)
- TURN Server Cost Explosion — Bandwidth costs scale exponentially; 45-min session with 12 participants can consume 5-15 GB (mitigation: deploy TURN on separate VPS, monitor bandwidth)

### No External Spec References
No external WebRTC specifications, ADRs, or technical documents were referenced during discussion. All decisions based on requirements, existing codebase patterns, and user preferences.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Socket.IO signaling** (`src/lib/socket.ts`): WebRTC event types already defined (`signal`, `toggle-audio`, `toggle-video`), room namespace pattern, reconnection handling
- **Room state management** (`src/store/roomStore.ts`): Zustand store with participant tracking, connection status, message deduplication
- **Socket connection hook** (`src/hooks/useSocket.ts`): Connection lifecycle management, automatic reconnection with exponential backoff
- **Room presence hook** (`src/hooks/useRoomPresence.ts`): 15s heartbeat, participant join/leave tracking
- **Chat hook** (`src/hooks/useRoomChat.ts`): Message history, rate limiting (10 messages/minute)
- **UI components** (`src/components/ui/`): shadcn/ui components (Button, Badge, Dialog) for video grid and control bar

### Established Patterns
- **Singleton pattern** (socket.ts): Prevents duplicate connections to same room namespace
- **Event deduplication** (roomStore.ts): Prevents duplicate participants/messages on reconnection
- **Graceful reconnection** (useSocket.ts): Automatic state resync after reconnect, exponential backoff
- **Type-safe events** (socket.ts): TypeScript interfaces for ServerToClientEvents and ClientToServerEvents
- **Zustand state management**: Lightweight pattern for real-time room state (no Redux boilerplate)

### Integration Points
- **WebRTC signaling**: Use existing Socket.IO server from Phase 3 (server at `/room-{roomId}` namespace)
- **Room state**: Extend roomStore to include video/audio state (isMuted, isVideoOff, activeSpeakerId)
- **Authentication**: Use existing NextAuth.js session (JWT tokens from Phase 1) for TURN credential generation
- **Room management**: Use existing Room model from Phase 2 (capacity, overflow room logic)
- **Error handling**: Use existing Sonner toast library for connection error notifications
</canonical_refs>

<specifics>
## Specific Ideas

### Speaker Border Highlight
User emphasized: "It should be a grid with the person who is speaking denoted by a border around their box." This should be a simple solid border (not animated) to avoid distraction for ADHD users. The hybrid approach (automatic audio detection + manual raise hand) gives maximum flexibility while minimizing false positives.

### Bottom Control Bar Always Visible
User chose "always visible" (not auto-hide) because ADHD users may forget where controls are or struggle with discovery. Always-visible controls reduce cognitive load and anxiety.

### Timer on Header with Accent Color
User specified: "small sticker on the header of the screen with accent color so that it is easily visible." The accent color ensures visibility without being obtrusive. No color change (no red/orange urgency) to avoid stress and anxiety.

### No Urgency Signals
User rejected timer color change at 5/10 minutes remaining, choosing "no color change" instead. This aligns with ADHD-friendly UX: gentle, non-stressful experience. The timer is always visible but never alarming.

### Captain Flexibility
User chose "both options" for captain controls (tap individual card OR "Mute All" button). Maximum flexibility lets captains handle different situations: disruptive single participant vs. entire room needs muting.

### Overflow Room Naming
User didn't specify exact overflow room naming convention. Recommend: "{Original Room Name} - Overflow" with unique identifier if multiple overflow rooms needed (e.g., "9:00 AM Focus Room - Overflow 1").

### No "Claude's Discretion" Overuse
User consistently provided clear preferences rather than deferring to Claude. When uncertain between options, user chose the ADHD-friendly option (e.g., always-visible controls, no urgency signals). This indicates strong user vision for calm, predictable UX.

### No External References
User did not reference any WebRTC documentation, mediasoup guides, or TURN server tutorials during discussion. All decisions based on requirements, existing codebase patterns, and UX preferences for ADHD users.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 4 scope (video/audio connectivity, controls, timer, overflow rooms, attendance validation). No new capabilities or features outside Phase 4 boundary were introduced.

All gray areas clarified either by user selection or by Claude's discretion (connection quality UI: minimal, non-distracting approach).
</deferred>

---

*Phase: 04-webrtc-integration*
*Context gathered: 2026-04-07*
