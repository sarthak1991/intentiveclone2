# Phase 5: Focus Session Features - Context

**Gathered:** 2026-04-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete focus session experience with tasks, accountability, gamification, and captain system. This phase delivers the behavioral and motivational layer that makes focus rooms effective for ADHD users.

**What this includes:**
- Task submission before session (lobby modal, 100 char limit)
- Task display during session (corner overlay card, hover for details)
- 5-minute "task complete?" prompt (task card highlight → modal)
- Confetti celebration on task completion (always)
- Incomplete task handling (show as suggestion in next lobby, manual browse for next room)
- Streak counter with persistent nav badge (🔥 N)
- Session history (recent list on profile, past 7 sessions)
- Captain eligibility system (4+ completed sessions, admin approval required)
- Captain controls (aggregate task visibility, Mute All + individual mute)
- Captain reward tracking (progress bar: "3/4 until free session")
- Emergency captain assignment (admin can assign anyone to empty captain slots)

**What this does NOT include:**
- Payment processing (Phase 6)
- Email notifications (Phase 6)
- Admin analytics dashboards (Phase 7)
</domain>

<decisions>
## Implementation Decisions

### Task Submission & Display
- **D-01:** Use **lobby modal** for task submission — dedicated screen after registering, before joining video room, with 5-minute countdown to session start
- **D-02:** Display task as **corner overlay card** during session — shows first 3-5 words, expands on hover to show full task, minimally intrusive
- **D-03:** Allow **editing during first 5 minutes only** — balances flexibility with commitment, locks after 5 minutes to prevent mid-session goal-shifting
- **D-04:** Set **100 character limit** for tasks — short and focused, encourages single-task commitment, prevents overwhelm for ADHD users

### Accountability Flow
- **D-05:** Use **task card highlight** for 5-minute prompt — corner task card pulses/animates, clicking opens modal with "Did you complete this task?", subtle but visible
- **D-06:** Use **manual browse only** for next room suggestion — no auto-suggestions when task incomplete, user browses room calendar and chooses themselves, avoids nagging
- **D-07:** Show incomplete task **as suggestion** in next lobby — displays "Previous goal: [task text]" that user can click to reuse or type new one, explicit choice not auto-fill

### Gamification
- **D-08:** Trigger confetti **always on complete** — every task completion gets celebrated, reinforces achievement loop
- **D-09:** Display streak counter as **persistent nav badge** — 🔥 N badge in navigation header, always visible, constant positive reminder
- **D-10:** Show **encouraging restart message** on streak break — "Ready to start a new streak!" neutral message, emphasizes fresh start not failure, shame-free for ADHD users
- **D-11:** Show session history as **recent list** — "Past 7 sessions" on profile with status icons (✓ completed, ○ incomplete), clean, no overwhelming calendar
- **D-12:** Use **minimal icons** for progress display — text-based with simple icons, numbers, badges, avoids visual overload for ADHD users

### Captain System
- **D-13:** Use **admin approval only** for captain invitations — system identifies eligible users (4+ completed sessions) but admin manually reviews and invites, quality control
- **D-14:** Allow **emergency captain assignment** — for sessions with no assigned captain, admin can assign ANY user as captain regardless of completed sessions
- **D-15:** Show captains **aggregate task visibility only** — "8/10 participants submitted tasks" count but NOT individual task content, privacy-first approach
- **D-16:** Provide **Mute All + individual mute** controls — captains get both "Mute All" (soft mute, participants can unmute) and individual mute (stays muted until captain unmutes), maximum flexibility
- **D-17:** Show **progress bar** for captain rewards — "3/4 sessions until free session!" gamifies captain role, provides tangible progress toward rewards
- **D-18:** Enforce **max 2 captain sessions per day** — prevents captain burnout, per CAPT-07 requirement

### Claude's Discretion
- **Confetti library**: Choose canvas-confetti or similar lightweight library for celebration animation, ensure it plays well with video grid performance
- **Task card animation style**: Design subtle pulse animation for 5-minute prompt that grabs attention without distracting from session
- **Streak badge positioning**: Exact placement in nav header (left, center, right) and styling (fire emoji vs icon)
- **Progress bar design**: Visual style for captain reward progress (linear bar, circular, badge-based)
- **Emergency captain notification**: How assigned user is notified they've been made captain for a session (in-app message, email, both)
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Tasks & Accountability — TASK-01 through TASK-07: Task submission, display, prompts, confetti, next room suggestion, auto-carry, completion tracking
- `.planning/REQUIREMENTS.md` §Gamification & Progress — GAME-01 through GAME-04: Streak counter, session history, attendance stats, visual progress indicators
- `.planning/REQUIREMENTS.md` §Community & Social — COMM-03, COMM-04: Next room suggestion, interest-based room matching
- `.planning/REQUIREMENTS.md` §Room Captains — CAPT-01 through CAPT-07: Eligibility, invitations, admin assignment, goal visibility, mute controls, free session rewards, daily limits
- `.planning/REQUIREMENTS.md` §Admin Panel — ADMN-04, ADMN-07: Admin captain assignment, captain remarks viewing
- `.planning/ROADMAP.md` §Phase 5: Focus Session Features — Phase goal, success criteria, and plan list (7 plans)

### Existing Code Patterns (Phase 1-4)
- `src/store/roomStore.ts` — Zustand store with room state, attendance tracking (`attendedSessions` Set), can extend for task state
- `src/components/ui/` — shadcn/ui components (Card, Button, Badge, Dialog) for reuse in task modal, captain panel
- `src/components/room/SessionTimer.tsx` — Reference for timer implementation, can be adapted for 5-minute task prompt
- `src/hooks/useSocket.ts` — Socket.IO client for real-time task state synchronization
- `src/lib/socket.ts` — Event types for task submission, completion, captain events

### Component Library
- `src/components/ui/card.tsx` — Reuse for task overlay card and captain panel
- `src/components/ui/badge.tsx` — Reuse for streak badge and progress indicators
- `src/components/ui/dialog.tsx` — Reuse for task submission modal and completion prompt
- Tailwind CSS utilities for animations (pulse, hover effects) and responsive layout

### Prior Phase Context
- `.planning/phases/01-foundation-authentication/01-CONTEXT.md` — User model, session management, MongoDB GridFS patterns
- `.planning/phases/04-webrtc-integration/04-CONTEXT.md` — Room state management, video grid layout, control bar patterns, attendance tracking
- `CLAUDE.md` §Technology Stack — Next.js 16.2.2, MongoDB 7.0+ with Mongoose 8.x, Socket.IO 4.8.3, Zustand state management

### Known Decisions from Prior Phases
- **Phase 1 (D-01)**: Use shadcn/ui for UI components
- **Phase 1 (D-07)**: Use gentle, helpful error messages (ADHD-friendly UX)
- **Phase 4 (D-04)**: Bottom control bar, always visible (ADHD users forget where controls are)
- **Phase 4 (D-10)**: No color change for urgency signals (consistent, less stressful)

### No External Spec References
No external specifications, ADRs, or technical documents were referenced during discussion. All decisions based on requirements, existing codebase patterns, and ADHD-friendly UX preferences.
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Zustand store** (`src/store/roomStore.ts`): Room state, participant tracking, attendance tracking — extend for task state (currentTask, taskCompleted, streakCount)
- **Socket.IO client** (`src/lib/socket.ts`): Event types for signaling — add task events (`task-submit`, `task-complete`, `captain-assign`)
- **shadcn/ui components**: Card (task overlay, captain panel), Badge (streak badge), Dialog (task modal, completion prompt), Button (all actions)
- **SessionTimer** (`src/components/room/SessionTimer.tsx`): Reference implementation for countdown timer — adapt for 5-minute task prompt

### Established Patterns
- **Zustand state management**: Lightweight pattern for real-time state (roomStore already handles room state, extend for task/captain state)
- **Event deduplication** (roomStore.ts): Prevents duplicate state updates on reconnection — apply to task state sync
- **Graceful reconnection** (useSocket.ts): Automatic state resync after reconnect — preserve task completion through reconnect
- **Type-safe events** (socket.ts): TypeScript interfaces for ServerToClientEvents and ClientToServerEvents — add task/captain event types

### Integration Points
- **Room state**: Extend roomStore to include task state (currentTask, isTaskCompleted, taskCompletionTime)
- **Authentication**: Use existing NextAuth.js session for captain eligibility verification (userId → session count lookup)
- **Room management**: Use existing Room model from Phase 2 for captain assignments (room.captainId field)
- **Attendance tracking**: Use existing `attendedSessions` Set in roomStore for streak calculation
- **WebRTC video grid**: Add task overlay card on top of VideoGrid component (corner positioning)
- **Control bar**: Add captain mute buttons to existing ControlBar component (conditional render for captains)

### New Database Models Needed
- **Task**: MongoDB model for task submission (userId, roomId, taskText, submittedAt, completedAt, carriedOver)
- **SessionCompletion**: Track completion status per room session (roomId, userId, completed, incompleteReason)
- **CaptainAssignment**: Track captain assignments (roomId, captainId, assignedBy, assignedAt, sessionsCaptained, freeSessionsEarned)
- **Streak**: Track user streaks (userId, currentStreak, longestStreak, lastSessionDate)
</code_context>

<specifics>
## Specific Ideas

### Task Overlay Card Design
User specified: "Corner overlay card which expands when you hover over it with details of the task you filled. Otherwise just the first 3-5 words only." This keeps the task visible but minimally intrusive during the video session. Hover pattern respects the ADHD-friendly principle of "information available on demand" rather than constant display.

### Emergency Captain Assignment
User clarified: Admin can assign ANY user as captain for sessions with no assigned captain, regardless of completed sessions. This is an emergency coverage mechanism to ensure every session has captain oversight when possible, even if no eligible captains are available.

### 100-Character Task Limit
User chose the shortest option (100 chars) with rationale: "Short and focused. Encourages single-task focus." This directly addresses ADHD need for simplicity and prevents the multi-task overwhelm that complex goals can create.

### No Auto-Suggestion for Incomplete Tasks
User chose "Manual browse only" for next room suggestion: avoids nagging behavior. Users browse and choose their next session themselves rather than being pushed. Respects user autonomy and reduces pressure.

### Streak Break: "Ready to Start a New Streak!"
User selected encouraging restart message over acknowledgment or silence. Emphasizes fresh start rather than failure — critical for ADHD users who may already feel shame around lost motivation. The messaging is forward-looking, not backward-focused.

### Captain Progress Bar
User chose "Show progress bar" for captain rewards: "3/4 sessions until free session!" Gamifies the role and provides tangible progress. Makes the contribution visible and rewarding.

### Minimal Icons for Progress
User consistently chose minimal, non-distracting UI options (minimal icons vs visual everywhere, task card highlight vs full-screen modal). This reflects ADHD-friendly UX: avoid visual overload, keep focus on the work not the interface.
</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 5 scope (tasks, accountability, gamification, captain system). No new capabilities or features outside Phase 5 boundary were introduced.

All gray areas clarified by user selection. No deferred ideas to carry forward.
</deferred>

---

*Phase: 05-focus-session-features*
*Context gathered: 2026-04-07*
