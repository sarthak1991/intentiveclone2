# Plan 05-05 Summary: Captain Controls & Rewards

**Completed:** 2026-04-08
**Plan:** 05-05 - Captain controls & rewards (CAPT-04, CAPT-05, CAPT-06, CAPT-07)

---

## What Was Implemented

### 1. API Endpoints

**src/app/api/tasks/[roomId]/aggregate/route.ts** (GET)
- Privacy-first aggregate task count for captains
- Shows "8/10 participants submitted tasks" not individual task content (per D-15)
- Verifies captain status (room.captainId OR accepted CaptainAssignment)
- Returns: submitted, total, percentage

**src/app/api/rooms/[roomId]/captain-status/route.ts** (GET)
- Returns whether current user is captain for given room
- Checks both room.captainId and CaptainAssignment records

**src/app/api/captains/rewards/route.ts** (GET)
- Returns captain reward status:
  - sessionsCaptained: total sessions captained
  - freeSessionsEarned: floor(sessionsCaptained / 4)
  - progress: sessionsCaptained % 4 (0-3)
  - untilFreeSession: 4 - progress (1-4)
  - todaySessionCount: sessions captained today
  - canCaptainToday: todaySessionCount < 2

**src/app/api/captains/sessions/route.ts** (POST)
- Increments captain session count after captaining
- Enforces daily limit: max 2 sessions per day (per CAPT-07)
- Returns 403 when daily limit reached
- Awards free session every 4 sessions (freeSessionsEarned += 1)

### 2. State Management

**src/store/roomStore.ts** (extended)
- Added captain state fields:
  - isCaptain: boolean
  - captainId: string | null
  - mutedParticipants: Set<string>
- Added captain actions:
  - setCaptainStatus(isCaptain, captainId)
  - setParticipantMuted(userId, isMuted)
  - muteAll(): adds all participants to muted set
  - unmuteAll(): clears muted set

### 3. React Hook

**src/hooks/useCaptainControls.ts**
- Verifies captain status via /api/rooms/[roomId]/captain-status
- Fetches aggregate task count when isCaptain
- Listens for 'task-submitted' event for real-time updates
- Mute control functions:
  - handleMuteAll(): emits 'captain-mute-all', updates store
  - handleUnmuteAll(): emits 'captain-unmute-all', clears store
  - handleMuteParticipant(userId): emits 'captain-mute-participant'
  - handleUnmuteParticipant(userId): emits 'captain-unmute-participant'

### 4. UI Components

**src/components/ui/progress.tsx** (new)
- Simple progress bar component
- Value prop (0-100) controls fill percentage

**src/components/room/CaptainPanel.tsx** (new)
- Only visible when isCaptain === true
- Task Participation section:
  - Shows aggregate count: "8/10 participants submitted tasks"
  - Percentage displayed: "(80%)"
- Mute Controls section:
  - "Mute All" button (soft mute, participants can unmute)
  - "Unmute All" button
  - Individual participant list with Mute/Unmute buttons
- Reward Progress section:
  - "3/4 sessions" badge
  - Progress bar showing progress toward free session
  - "Free sessions earned: N"
  - "N until free session" text
  - Daily limit indicator: "2/2 sessions today (limit reached)"

---

## Key Constraints Enforced

1. **Privacy-first task count** - Only aggregate (8/10), never individual task content (per D-15)
2. **Captain verification** - All captain APIs verify captain status server-side
3. **Mute state tracked** - Set of muted userIds in roomStore
4. **Free session every 4** - Calculated server-side: floor(sessionsCaptained / 4)
5. **Daily limit: 2 per day** - Enforced server-side, returns 403 when exceeded (per CAPT-07)

---

## Verification (Checkpoint Required)

### Human Verification Steps

1. Assign yourself as captain for a test room (via database or admin panel)
2. Join the room as captain
3. Verify CaptainPanel appears (only visible to captain)
4. Check task count: "X/Y participants submitted tasks"
5. Submit a test task as another user (or simulate)
6. Verify count updates in real-time
7. Click "Mute All" - verify button works
8. Click "Unmute All" - verify button works
9. Check reward progress bar shows correct sessions until free session
10. Verify free sessions count displays correctly

**Expected Results:**
- CaptainPanel only visible to captain
- Task count shows aggregate only (no individual tasks)
- Mute controls update participant mute state
- Progress bar accurate

---

## Success Criteria (from PLAN.md)

1. [x] Captain sees aggregate task count (8/10 submitted)
2. [x] Captain can mute all participants
3. [x] Captain can mute/unmute individual participants
4. [x] Reward progress shows (3/4 until free session)
5. [x] Free session earned every 4 captained sessions
6. [x] Daily limit enforced (max 2 per day)
7. [x] Captain controls only visible to captain
8. [x] Individual task content never exposed

**Status: COMPLETE - Awaiting Human Verification**
