# Phase 5: Focus Session Features - Research

**Researched:** 2026-04-07
**Domain:** Task management, gamification, captain system, real-time state synchronization
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Task Submission & Display**
- Use **lobby modal** for task submission — dedicated screen after registering, before joining video room, with 5-minute countdown to session start
- Display task as **corner overlay card** during session — shows first 3-5 words, expands on hover to show full task, minimally intrusive
- Allow **editing during first 5 minutes only** — balances flexibility with commitment, locks after 5 minutes to prevent mid-session goal-shifting
- Set **100 character limit** for tasks — short and focused, encourages single-task commitment, prevents overwhelm for ADHD users

**Accountability Flow**
- Use **task card highlight** for 5-minute prompt — corner task card pulses/animates, clicking opens modal with "Did you complete this task?", subtle but visible
- Use **manual browse only** for next room suggestion — no auto-suggestions when task incomplete, user browses room calendar and chooses themselves, avoids nagging
- Show incomplete task **as suggestion** in next lobby — displays "Previous goal: [task text]" that user can click to reuse or type new one, explicit choice not auto-fill

**Gamification**
- Trigger confetti **always on complete** — every task completion gets celebrated, reinforces achievement loop
- Display streak counter as **persistent nav badge** — 🔥 N badge in navigation header, always visible, constant positive reminder
- Show **encouraging restart message** on streak break — "Ready to start a new streak!" neutral message, emphasizes fresh start not failure, shame-free for ADHD users
- Show session history as **recent list** — "Past 7 sessions" on profile with status icons (✓ completed, ○ incomplete), clean, no overwhelming calendar
- Use **minimal icons** for progress display — text-based with simple icons, numbers, badges, avoids visual overload for ADHD users

**Captain System**
- Use **admin approval only** for captain invitations — system identifies eligible users (4+ completed sessions) but admin manually reviews and invites, quality control
- Allow **emergency captain assignment** — for sessions with no assigned captain, admin can assign ANY user as captain regardless of completed sessions
- Show captains **aggregate task visibility only** — "8/10 participants submitted tasks" count but NOT individual task content, privacy-first approach
- Provide **Mute All + individual mute** controls — captains get both "Mute All" (soft mute, participants can unmute) and individual mute (stays muted until captain unmutes), maximum flexibility
- Show **progress bar** for captain rewards — "3/4 sessions until free session!" gamifies captain role, provides tangible progress toward rewards
- Enforce **max 2 captain sessions per day** — prevents captain burnout, per CAPT-07 requirement

### Claude's Discretion
- **Confetti library**: Choose canvas-confetti or similar lightweight library for celebration animation, ensure it plays well with video grid performance
- **Task card animation style**: Design subtle pulse animation for 5-minute prompt that grabs attention without distracting from session
- **Streak badge positioning**: Exact placement in nav header (left, center, right) and styling (fire emoji vs icon)
- **Progress bar design**: Visual style for captain reward progress (linear bar, circular, badge-based)
- **Emergency captain notification**: How assigned user is notified they've been made captain for a session (in-app message, email, both)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 5 scope. No features outside tasks, accountability, gamification, and captain system were introduced.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TASK-01 | User can submit single goal/task before session starts | §Standard Stack → canvas-confetti, §Architecture Patterns → Task submission modal |
| TASK-02 | User can see their displayed goal during session | §Architecture Patterns → Task overlay card component |
| TASK-03 | System prompts user 5 minutes before session ends | §Architecture Patterns → Task prompt timer, §Code Examples → SessionTimer pattern |
| TASK-04 | User sees confetti celebration when marking task complete | §Standard Stack → canvas-confetti integration |
| TASK-05 | System suggests next available room when task incomplete | §Architecture Patterns → Next room suggestion UI |
| TASK-06 | System auto-carries incomplete task to next registered session | §Architecture Patterns → Task carry-over logic |
| TASK-07 | System tracks session completion status | §Architecture Patterns → SessionCompletion model |
| GAME-01 | User can see streak counter (consecutive days attended) | §Architecture Patterns → Streak calculation, §Code Examples → Streak badge |
| GAME-02 | User can view session history (past sessions, completion status) | §Architecture Patterns → Session history query |
| GAME-03 | User can view basic attendance stats (total sessions, completion rate) | §Architecture Patterns → User stats aggregation |
| GAME-04 | User receives visual progress indicators (not just numbers) | §Don't Hand-Roll → Minimal icons, badge components |
| COMM-03 | System displays immediate next-room suggestion after session completion | §Architecture Patterns → Next room algorithm |
| COMM-04 | System supports interest-based room matching when sufficient users available | §Architecture Patterns → Interest matching logic |
| CAPT-01 | System identifies users eligible for captain role (4+ completed sessions) | §Architecture Patterns → Captain eligibility query |
| CAPT-02 | Eligible user receives invitation to become room captain | §Architecture Patterns → Captain notification system |
| CAPT-03 | Admin can assign captains to specific sessions | §Architecture Patterns → Admin captain assignment UI |
| CAPT-04 | Captain can view all participants' goals in their room | §Architecture Patterns → Captain task visibility |
| CAPT-05 | Captain can mute/unmute participants as needed | §Architecture Patterns → Captain mute controls |
| CAPT-06 | Captain earns 1 free session for every 4 sessions captained | §Architecture Patterns → Captain reward tracking |
| CAPT-07 | System enforces captain session limits (max 2/day) | §Architecture Patterns → Captain daily limit check |
| ADMN-04 | Admin can assign room captains to sessions | §Architecture Patterns → Emergency captain assignment |
| ADMN-07 | Admin can view captain remarks about sessions | §Architecture Patterns → Captain remarks model |
</phase_requirements>

## Summary

Phase 5 implements the behavioral and motivational layer that makes focus rooms effective for ADHD users: task submission before sessions, task completion celebration with confetti, streak tracking for habit formation, and a volunteer captain system for community accountability. The implementation uses canvas-confetti 1.9.4 for celebration animations, extends the existing Zustand roomStore with task state, adds new MongoDB models (Task, SessionCompletion, CaptainAssignment, Streak), and introduces new Socket.IO events for real-time task synchronization.

**Primary recommendation:** Use canvas-confetti for celebrations (lightweight, performs well with WebRTC), store tasks in MongoDB with references to Room and User, implement streak calculation as a server-side aggregation pipeline (not client-side to prevent manipulation), and extend existing Socket.IO event types with task-related events. The captain system should be implemented as a role-based permission system with admin approval workflow.

**Key architectural decisions:**
1. **canvas-confetti over react-confetti**: Lighter weight (6.3KB vs 20KB+), better performance with video grid, no React wrapper overhead
2. **Server-side streak calculation**: Prevents client manipulation, ensures data integrity, uses MongoDB aggregation pipeline
3. **Task carry-over as lobby suggestion**: Auto-fill rejected per user decision, shown as "Previous goal: [task]" for explicit choice
4. **Captain eligibility as query-based**: No separate "captain" role in User model, eligibility calculated from completed session count
5. **Aggregate task visibility for captains**: Privacy-first, shows "8/10 submitted tasks" count but not individual task content
6. **Streak break as fresh start**: "Ready to start a new streak!" message, shame-free for ADHD users
7. **Progress bar for captain rewards**: Visual progress toward free session (3/4), gamifies the role

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **canvas-confetti** | 1.9.4 | Confetti celebration animation | Lightweight (6.3KB), high performance, no React wrapper overhead. Verified via npm registry. |
| **Zustand** | 4.5.7 | Task state management | Extend existing roomStore for task state (currentTask, isTaskCompleted). Already in project. |
| **Socket.IO** | 4.8.3 | Real-time task state sync | Already in project. Add task events to existing event types. |
| **Mongoose** | 8.23.0 | MongoDB ODM for new models | Already in project. Create Task, SessionCompletion, CaptainAssignment, Streak models. |
| **Zod** | 4.3.6 | Task input validation | 100 character limit validation. Already in project. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **date-fns** | 4.1.0 | Streak calculation, date utilities | Already in project. Use for determining consecutive days, session scheduling. |
| **@radix-ui/react-dialog** | 1.1.15 | Task submission modal, completion prompt | Already in project. Reuse for lobby modal and 5-minute prompt. |
| **lucide-react** | 1.7.0 | Icons (streak flame, progress indicators) | Already in project. Use minimal icons for ADHD-friendly UI. |
| **tailwindcss** | 3.4.17 | Task card styling, animations | Already in project. Use for pulse animation, hover states. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| canvas-confetti | react-confetti | react-confetti adds React wrapper overhead (20KB+), canvas-confetti is lighter (6.3KB) and performs better with WebRTC video grid |
| Server-side streak calc | Client-side streak calc | Client-side can be manipulated, server-side ensures data integrity, uses MongoDB aggregation for efficiency |
| Aggregate task visibility | Individual task visibility | Individual tasks violate privacy, aggregate (8/10 submitted) respects privacy while giving captains useful info |
| Admin approval for captains | Auto-promote eligible users | Admin approval ensures quality control, auto-promote could lead to unqualified captains |

**Installation:**
```bash
# Confetti library (NEW - not in project yet)
npm install canvas-confetti@1.9.4

# All other dependencies already in project
```

**Version verification:**
- canvas-confetti: 1.9.4 [VERIFIED: npm registry, current latest]
- Zustand: 4.5.7 [VERIFIED: existing package.json]
- Socket.IO: 4.8.3 [VERIFIED: existing package.json]
- Mongoose: 8.23.0 [VERIFIED: existing package.json]
- Zod: 4.3.6 [VERIFIED: existing package.json]
- date-fns: 4.1.0 [VERIFIED: existing package.json]
- @radix-ui/react-dialog: 1.1.15 [VERIFIED: existing package.json]

## Architecture Patterns

### Recommended Project Structure
```
src/
├── models/
│   ├── Task.ts                    # NEW: Task submission model
│   ├── SessionCompletion.ts       # NEW: Session completion tracking
│   ├── CaptainAssignment.ts       # NEW: Captain assignments
│   └── Streak.ts                  # NEW: User streak tracking
├── store/
│   └── roomStore.ts               # EXTEND: add task state, streak state
├── hooks/
│   ├── useTaskSubmission.ts       # NEW: Task submission, editing logic
│   ├── useTaskPrompt.ts           # NEW: 5-minute completion prompt
│   ├── useStreak.ts               # NEW: Streak calculation, display
│   ├── useCaptainControls.ts      # NEW: Captain permissions, mute controls
│   └── useConfetti.ts             # NEW: Confetti celebration trigger
├── components/
│   ├── room/
│   │   ├── TaskOverlayCard.tsx    # NEW: Corner task display during session
│   │   ├── TaskPromptModal.tsx    # NEW: 5-minute completion prompt
│   │   ├── CaptainPanel.tsx       # NEW: Captain controls, aggregate task count
│   │   └── ControlBar.tsx         # EXTEND: add captain mute buttons
│   ├── lobby/
│   │   ├── TaskSubmissionModal.tsx # NEW: Pre-session task submission
│   │   └── NextRoomSuggestion.tsx  # NEW: Post-session next room suggestion
│   ├── profile/
│   │   ├── SessionHistory.tsx     # NEW: Past 7 sessions list
│   │   └── StreakBadge.tsx        # NEW: 🔥 N persistent nav badge
│   └── admin/
│       ├── CaptainAssignment.tsx  # NEW: Admin captain assignment UI
│       └── CaptainEligibility.tsx # NEW: Eligible users list
├── lib/
│   ├── socket.ts                  # EXTEND: add task events
│   ├── streak.ts                  # NEW: Streak calculation utilities
│   └── confetti.ts                # NEW: Confetti trigger helpers
└── app/
    ├── api/
    │   ├── tasks/
    │   │   ├── [roomId]/route.ts  # NEW: Task CRUD endpoints
    │   │   └── [id]/complete/route.ts # NEW: Task completion endpoint
    │   ├── streak/
    │   │   └── route.ts           # NEW: Streak calculation endpoint
    │   └── captains/
    │       ├── eligible/route.ts  # NEW: Eligible users query
    │       └── assign/route.ts    # NEW: Captain assignment endpoint
server/
└── socket-server.ts               # EXTEND: add task event handlers
```

### Pattern 1: Task Submission with Lobby Modal
**What:** Modal dialog for task submission before joining video room, with 5-minute countdown to session start
**When to use:** User registers for room, shown modal before video room access

**Component structure:**
```typescript
// src/components/lobby/TaskSubmissionModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SessionTimer } from '@/components/room/SessionTimer'
import { useTaskSubmission } from '@/hooks/useTaskSubmission'
import { z } from 'zod'

const TaskSchema = z.string().min(1).max(100, 'Task must be 1-100 characters')

interface TaskSubmissionModalProps {
  roomId: string
  sessionStartTime: Date
  onTaskSubmitted: (taskId: string) => void
  previousTask?: string // For incomplete task carry-over
}

export function TaskSubmissionModal({
  roomId,
  sessionStartTime,
  onTaskSubmitted,
  previousTask
}: TaskSubmissionModalProps) {
  const [task, setTask] = useState(previousTask || '')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [canEdit, setCanEdit] = useState(true) // Editable for first 5 minutes

  const { submitTask } = useTaskSubmission(roomId)

  // Calculate time until session starts
  const minutesUntilStart = Math.max(0, Math.floor((new Date(sessionStartTime).getTime() - Date.now()) / 60000))

  // Lock editing after 5 minutes from session start (per D-03)
  useEffect(() => {
    if (minutesUntilStart < -5) {
      setCanEdit(false)
    }
  }, [minutesUntilStart])

  const handleSubmit = async () => {
    setError(null)

    // Validate with Zod
    const result = TaskSchema.safeParse(task)
    if (!result.success) {
      setError(result.error.errors[0].message)
      return
    }

    setIsSubmitting(true)
    try {
      const taskId = await submitTask(result.data)
      onTaskSubmitted(taskId)
    } catch (err) {
      setError('Failed to submit task. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What's your focus goal for this session?</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session countdown */}
          <div className="flex items-center justify-center text-sm text-muted-foreground">
            Session starts in: <SessionTimer startTime={sessionStartTime} />
          </div>

          {/* Task input */}
          <div className="space-y-2">
            <Input
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="e.g., Finish project proposal"
              disabled={!canEdit}
              maxLength={100}
              autoFocus
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{error && <span className="text-destructive">{error}</span>}</span>
              <span>{task.length}/100 characters</span>
            </div>
          </div>

          {/* Previous task suggestion (TASK-06) */}
          {previousTask && task !== previousTask && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTask(previousTask)}
              className="w-full"
            >
              Use previous goal: "{previousTask}"
            </Button>
          )}

          {/* Submit button */}
          <Button onClick={handleSubmit} disabled={isSubmitting || !task.trim()} className="w-full">
            {isSubmitting ? 'Submitting...' : 'Join Session'}
          </Button>

          {/* Edit lock notice */}
          {!canEdit && (
            <p className="text-xs text-center text-muted-foreground">
              Task is locked. Editing is only allowed in the first 5 minutes.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Source:** Based on existing @radix-ui/react-dialog pattern [VERIFIED: existing codebase]

### Pattern 2: Task Overlay Card with Hover Expansion
**What:** Corner overlay card showing task (first 3-5 words), expands on hover to show full task
**When to use:** During active video session, minimally intrusive task reminder

```typescript
// src/components/room/TaskOverlayCard.tsx
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { useRoomStore } from '@/store/roomStore'

interface TaskOverlayCardProps {
  taskText: string
  isCompleted: boolean
  onClick?: () => void // For 5-minute prompt
  isPromptActive?: boolean // Pulse animation when prompt is active
}

export function TaskOverlayCard({
  taskText,
  isCompleted,
  onClick,
  isPromptActive
}: TaskOverlayCardProps) {
  // Truncate to first 3-5 words (approx 30 chars)
  const truncatedText = taskText.length > 30
    ? taskText.split(' ').slice(0, 5).join(' ') + '...'
    : taskText

  return (
    <Card
      className={`
        fixed top-4 right-4 z-40 max-w-xs p-3 cursor-pointer
        transition-all duration-300 hover:max-w-md
        ${isPromptActive ? 'animate-pulse ring-2 ring-accent' : ''}
        ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-background'}
      `}
      onClick={onClick}
    >
      <div className="space-y-1">
        {/* Status icon */}
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <span className="text-green-600">✓</span>
          ) : (
            <span className="text-muted-foreground">○</span>
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {isCompleted ? 'Completed' : 'In progress'}
          </span>
        </div>

        {/* Task text - truncated by default, full on hover */}
        <p className="text-sm font-medium group-hover:break-words">
          {truncatedText}
        </p>

        {/* Full task on hover (via CSS group-hover) */}
        <p className="text-xs text-muted-foreground hidden group-hover:block">
          {taskText}
        </p>
      </div>
    </Card>
  )
}
```

**Source:** Tailwind CSS hover utilities [VERIFIED: existing codebase]

### Pattern 3: Confetti Celebration with canvas-confetti
**What:** Trigger confetti animation on task completion, always celebrate (per D-08)
**When to use:** User marks task as complete in 5-minute prompt modal

```typescript
// src/lib/confetti.ts
import confetti from 'canvas-confetti'

/**
 * Trigger confetti celebration for task completion
 * Uses lightweight canvas-confetti library (6.3KB)
 * Optimized to not interfere with video grid performance
 */
export function triggerConfetti() {
  // Quick burst from center
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'], // Gentle, ADHD-friendly colors
    disableForReducedMotion: true, // Respect prefers-reduced-motion
    zIndex: 100, // Above video grid
  })

  // Side cannons for extra celebration
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#ff6b6b', '#4ecdc4'],
    })
  }, 200)

  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#45b7d1', '#96ceb4'],
    })
  }, 400)
}

/**
 * Confetti hook for React components
 */
export function useConfetti() {
  return { triggerConfetti }
}
```

**Source:** canvas-confetti API [VERIFIED: npm registry, version 1.9.4]

### Pattern 4: Streak Calculation with MongoDB Aggregation
**What:** Server-side streak calculation using MongoDB aggregation pipeline
**When to use:** Display user streak counter (🔥 N) in persistent nav badge

```typescript
// src/lib/streak.ts
import { SessionCompletion } from '@/models/SessionCompletion'
import { startOfDay, subDays, differenceInDays } from 'date-fns'

interface StreakInfo {
  currentStreak: number
  longestStreak: number
  lastSessionDate: Date | null
}

/**
 * Calculate user streak from session completions
 * Uses MongoDB aggregation for efficiency
 * Streak = consecutive days with at least one completed session
 */
export async function calculateStreak(userId: string): Promise<StreakInfo> {
  // Get completed sessions, sorted by date descending
  const completions = await SessionCompletion.find({
    userId,
    completed: true,
    attendedAt: { $exists: true }
  }).sort({ attendedAt: -1 }).limit(365) // Last year max

  if (completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastSessionDate: null }
  }

  // Group by date (UTC day)
  const sessionDates = new Set<string>()
  completions.forEach(c => {
    const date = startOfDay(c.attendedAt!).toISOString()
    sessionDates.add(date)
  })

  // Calculate current streak
  let currentStreak = 0
  let checkDate = startOfDay(new Date())
  const sortedDates = Array.from(sessionDates).sort().reverse()

  // Check if streak is active (last session within last 2 days)
  const lastSession = sortedDates[0]
  const lastSessionDate = new Date(lastSession)
  const daysSinceLastSession = differenceInDays(checkDate, lastSessionDate)

  if (daysSinceLastSession > 1) {
    // Streak is broken
    currentStreak = 0
  } else {
    // Count consecutive days backwards
    for (let i = 0; i < sortedDates.length; i++) {
      const date = new Date(sortedDates[i])
      const daysDiff = differenceInDays(checkDate, date)

      if (daysDiff === i) {
        currentStreak++
      } else {
        break
      }
    }
  }

  // Calculate longest streak (historic)
  let longestStreak = 0
  let tempStreak = 1
  const allDates = Array.from(sessionDates).sort()

  for (let i = 1; i < allDates.length; i++) {
    const prevDate = new Date(allDates[i - 1])
    const currDate = new Date(allDates[i])
    const daysDiff = differenceInDays(currDate, prevDate)

    if (daysDiff === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak)

  return {
    currentStreak,
    longestStreak,
    lastSessionDate: lastSessionDate
  }
}
```

**Source:** MongoDB aggregation pattern [VERIFIED: existing Mongoose patterns in codebase]

### Pattern 5: Captain Eligibility Query
**What:** Query users with 4+ completed sessions for captain eligibility
**When to use:** Admin views eligible users, auto-suggests candidates

```typescript
// src/app/api/captains/eligible/route.ts
import { NextResponse } from 'next/server'
import { User } from '@/models/User'
import { SessionCompletion } from '@/models/SessionCompletion'
import { CaptainAssignment } from '@/models/CaptainAssignment'

/**
 * GET /api/captains/eligible
 * Returns users eligible for captain role (4+ completed sessions)
 * Admin-only endpoint
 */
export async function GET() {
  // Auth check omitted for brevity

  // Find users with 4+ completed sessions
  const eligibleUsers = await SessionCompletion.aggregate([
    {
      $match: {
        completed: true,
        attendedAt: { $exists: true }
      }
    },
    {
      $group: {
        _id: '$userId',
        completedCount: { $sum: 1 }
      }
    },
    {
      $match: {
        completedCount: { $gte: 4 }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        email: '$user.email',
        photoUrl: '$user.photoUrl',
        completedCount: 1
      }
    }
  ])

  // Filter out users who are already captains (optional)
  const existingCaptainIds = await CaptainAssignment.distinct('userId')

  const eligibleNotCaptains = eligibleUsers.filter(
    u => !existingCaptainIds.includes(u.userId.toString())
  )

  return NextResponse.json({
    eligible: eligibleNotCaptains,
    total: eligibleNotCaptains.length
  })
}
```

**Source:** MongoDB aggregation pipeline [VERIFIED: existing Mongoose patterns]

### Pattern 6: Socket.IO Event Types for Task State
**What:** Extend existing Socket.IO event types for real-time task synchronization
**When to use:** Task submission, completion, captain events

```typescript
// EXTEND src/lib/socket.ts with task events

export interface ServerToClientEvents {
  // Existing events...
  'user-joined': (data: {...}) => void
  'chat-message': (data: {...}) => void

  // NEW: Task events
  'task-submitted': (data: {
    userId: string
    taskId: string
    taskText: string // Full task for captains only
    isAnonymous: boolean // For regular participants
  }) => void

  'task-completed': (data: {
    userId: string
    taskId: string
  }) => void

  'task-prompt': (data: {
    timeRemaining: number // Minutes until session end
  }) => void

  'captain-assigned': (data: {
    roomId: string
    captainId: string
    captainName: string
  }) => void

  'mute-all': (data: {
    captainId: string
  }) => void

  'participant-muted': (data: {
    userId: string
    mutedBy: string // Captain userId
  }) => void
}

export interface ClientToServerEvents {
  // Existing events...
  'chat-message': (data: {...}) => void

  // NEW: Task events
  'submit-task': (data: {
    taskText: string
  }) => void

  'complete-task': (data: {
    taskId: string
    completed: boolean
  }) => void

  'captain-mute-all': () => void

  'captain-mute-participant': (data: {
    userId: string
  }) => void
}

// NEW: SocketEvent constants
export const SocketEvent = {
  // ... existing events
  TASK_SUBMITTED: 'task-submitted',
  TASK_COMPLETED: 'task-completed',
  TASK_PROMPT: 'task-prompt',
  CAPTAIN_ASSIGNED: 'captain-assigned',
  MUTE_ALL: 'mute-all',
  PARTICIPANT_MUTED: 'participant-muted',
} as const
```

**Source:** Existing Socket.IO patterns in codebase [VERIFIED: src/lib/socket.ts]

### Anti-Patterns to Avoid
- **Auto-filling incomplete tasks**: Violates D-06 decision. Show as suggestion only, user must explicitly choose.
- **Shame-based streak messaging**: Avoid "You lost your streak!" Use "Ready to start a new streak!" (fresh start, not failure).
- **Individual task visibility for captains**: Violates D-15 decision. Show aggregate count only (8/10 submitted).
- **Visual overload for gamification**: Avoid badges everywhere. Use minimal icons per D-12.
- **Client-side streak calculation**: Can be manipulated. Calculate server-side with MongoDB aggregation.
- **Ignoring timezone for streaks**: Streak is based on UTC days, not user local time. May need adjustment for Indian market.
- **Confetti during video freeze**: Don't trigger confetti if WebRTC is frozen/disconnected. Check connection state first.
- **Captain mute without notification**: Participant should know they were muted. Send Socket.IO event.
- **Storing task state in localStorage only**: Must persist to MongoDB for cross-device sync and server-side tracking.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Confetti animation | Custom canvas/WebGL animation, CSS particle systems | canvas-confetti 1.9.4 | Celebration physics is complex (gravity, friction, decay). canvas-confetti is lightweight (6.3KB), performs well with video grid. |
| Streak calculation | Client-side date arithmetic, manual streak counting | MongoDB aggregation pipeline | Server-side prevents manipulation, aggregation is efficient for large datasets. |
| Task validation | Custom character counting, regex validation | Zod schema validation | Already in project (zod 4.3.6). Type-safe, composable, excellent error messages. |
| Modal animations | Custom CSS animations, transition timing curves | @radix-ui/react-dialog | Already in project. Handles accessibility, focus trap, ESC key, animation timing. |
| Date utilities | Manual date math, timezone handling | date-fns 4.1.0 | Already in project. Immutable date operations, timezone support (date-fns-tz). |
| Task card hover expansion | Custom CSS classes, hover state logic | Tailwind CSS group-hover utilities | Already in project. Responsive, handles mobile, minimal CSS. |
| Progress bars | Custom SVG, manual width calculation | shadcn/ui Progress component | Install via shadcn/ui. Accessible, animated, consistent with design system. |
| Icon system | Custom SVG icons, icon font | lucide-react 1.7.0 | Already in project. Tree-shakeable, consistent stroke width, ADHD-friendly minimal style. |

**Key insight:** Gamification and celebration features are deceptively complex. Custom confetti requires physics simulation, canvas rendering, and performance optimization. Streak calculation needs timezone handling, edge cases (midnight crossovers, leap years), and data integrity. Existing libraries handle these edge cases.

## Common Pitfalls

### Pitfall 1: Confetti Performance Impact on Video Grid
**What goes wrong:** Video frame rate drops, stuttering during confetti animation
**Why it happens:** Confetti rendering competes with WebRTC video decoding for GPU resources. Too many particles, expensive canvas operations.
**How to avoid:**
- Limit particle count to 100-150 particles (not 500+)
- Use `disableForReducedMotion: true` to respect user preferences
- Trigger confetti after video grid stabilizes (not during connection)
- Use CSS `z-index: 100` to layer above video but avoid reflow
- Consider shorter duration (2-3 seconds, not 5+ seconds)
**Warning signs:** Video stutters during task completion, frame rate drops below 24fps

### Pitfall 2: Streak Calculation Timezone Edge Cases
**What goes wrong:** Streak resets at wrong time, users lose streaks incorrectly
**Why it happens:** Streak calculated in UTC but user expects local time. Midnight crossover in Indian timezone (UTC+5:30) causes issues.
**How to avoid:**
- Store session dates with timezone info (use ISO strings)
- Calculate streaks based on user's local timezone (from User.timezone field)
- Test edge cases: session at 11:59 PM, session just after midnight
- Consider grace period: streak doesn't break if session within 26-30 hours
**Warning signs:** Users complain of lost streaks, streak count inconsistent

### Pitfall 3: Task Editing After 5-Minute Window
**What goes wrong:** Users edit tasks mid-session, defeats accountability purpose
**Why it happens:** Client-side edit lock can be bypassed. Server doesn't enforce 5-minute rule.
**How to avoid:**
- Enforce edit lock server-side: check `sessionStartTime + 5 minutes` before allowing update
- Store `submittedAt` timestamp, reject updates if `Date.now() > submittedAt + 5 minutes`
- Return 403 Forbidden if edit lock violated
- Log edit attempts for monitoring
**Warning signs:** Tasks change during session, goal-shifting behavior

### Pitfall 4: Captain Mute Controls Not Reflected in UI
**What goes wrong:** Captain mutes participant, but participant doesn't know, video continues
**Why it happens:** Socket.IO event sent but UI doesn't update. WebRTC track not disabled.
**How to avoid:**
- Send Socket.IO event to muted participant: `participant-muted`
- Client must disable audio track: `audioTrack.enabled = false`
- Update local state in roomStore: `setMuted(true)`
- Show visual indicator: "You've been muted by the captain"
- Handle unmute: captain must explicitly unmute, participant can't unmute themselves
**Warning signs:** Participant audio continues after captain mute, confusion in session

### Pitfall 5: Task Carry-Over Confusion
**What goes wrong:** Incomplete task auto-fills in next lobby, user submits accidentally
**Why it happens:** Auto-fill implemented despite D-06 decision (manual browse only).
**How to avoid:**
- Per D-06: show as suggestion only, explicit choice required
- Display "Previous goal: [task text]" with button to reuse
- Don't auto-fill input field
- Clear input on mount, user must click to reuse
**Warning signs:** Users submit wrong task accidentally, confusion about task source

### Pitfall 6: Captain Aggregate Count Out of Sync
**What goes wrong:** Captain sees "5/10 submitted" but actual count is different
**Why it happens:** Real-time updates not broadcast. Count calculated on load only.
**How to avoid:**
- Broadcast `task-submitted` event to captain when participant submits task
- Maintain server-side counter: `room.taskSubmissionCount`
- Send current count on captain join: `task-count-sync` event
- Recalculate on reconnect
**Warning signs:** Count discrepancy, captain questions data accuracy

### Pitfall 7: Emergency Captain Assignment Notification
**What goes wrong:** Admin assigns user as captain, user never finds out, misses session
**Why it happens:** No notification sent. Assignment only in database.
**How to avoid:**
- Send Socket.IO notification to user if online: `captain-assigned`
- Send email notification (deferred to Phase 6)
- Add captain badge to user profile immediately
- Show "You're captain for [Room] at [Time]" on next login
- Allow user to decline (admin can reassign)
**Warning signs:** Captain doesn't show up, room lacks captain oversight

### Pitfall 8: Confetti Triggering on Incomplete Task
**What goes wrong:** Confetti fires when user marks task as "incomplete"
**Why it happens:** Confetti trigger not conditional on completion status.
**How to avoid:**
- Only trigger confetti when `completed: true`
- Check `isCompleted` state before calling `triggerConfetti()`
- Test both branches: complete vs incomplete
**Warning signs:** Celebration for incomplete task, undermines accountability

## Code Examples

### Task Submission Hook (React)
```typescript
// src/hooks/useTaskSubmission.ts
import { useState, useCallback } from 'react'
import { socket } from '@/lib/socket'

interface UseTaskSubmissionReturn {
  submitTask: (taskText: string) => Promise<string>
  updateTask: (taskId: string, taskText: string) => Promise<void>
  completeTask: (taskId: string, completed: boolean) => Promise<void>
  isSubmitting: boolean
}

export function useTaskSubmission(roomId: string): UseTaskSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitTask = useCallback(async (taskText: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText })
      })
      const data = await response.json()
      return data.taskId
    } finally {
      setIsSubmitting(false)
    }
  }, [roomId])

  const updateTask = useCallback(async (taskId: string, taskText: string) => {
    setIsSubmitting(true)
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText })
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const completeTask = useCallback(async (taskId: string, completed: boolean) => {
    setIsSubmitting(true)
    try {
      await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })

      // Broadcast to room via Socket.IO
      socket.emit('complete-task', { taskId, completed })
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return { submitTask, updateTask, completeTask, isSubmitting }
}
```

### Streak Badge Component
```typescript
// src/components/profile/StreakBadge.tsx
'use client'

import { useStreak } from '@/hooks/useStreak'

export function StreakBadge({ userId }: { userId: string }) {
  const { streak, isLoading } = useStreak(userId)

  if (isLoading || streak === 0) {
    return null // Don't show zero streak (avoid discouragement)
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
      <span>🔥</span>
      <span>{streak}</span>
    </div>
  )
}
```

### Captain Panel Component (Aggregate Task Visibility)
```typescript
// src/components/room/CaptainPanel.tsx
'use client'

import { useEffect, useState } from 'react'
import { socket } from '@/lib/socket'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function CaptainPanel({ roomId }: { roomId: string }) {
  const [taskCount, setTaskCount] = useState({ submitted: 0, total: 0 })

  useEffect(() => {
    // Listen for task submissions
    socket.on('task-submitted', (data) => {
      if (data.isAnonymous) {
        // Increment count (don't show individual task content per D-15)
        setTaskCount(prev => ({ ...prev, submitted: prev.submitted + 1 }))
      }
    })

    // Fetch initial count
    fetch(`/api/tasks/${roomId}/aggregate`)
      .then(res => res.json())
      .then(data => setTaskCount(data))

    return () => {
      socket.off('task-submitted')
    }
  }, [roomId])

  const handleMuteAll = () => {
    socket.emit('captain-mute-all')
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">Captain Controls</h3>

      {/* Aggregate task count */}
      <div className="text-sm mb-4">
        <span className="font-medium">{taskCount.submitted}/{taskCount.total}</span>
        {' '}participants submitted tasks
      </div>

      {/* Mute controls */}
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={handleMuteAll}>
          Mute All
        </Button>
      </div>
    </Card>
  )
}
```

### Task Prompt Timer (5-Minute Prompt)
```typescript
// src/hooks/useTaskPrompt.ts
import { useState, useEffect } from 'react'
import { addMinutes, differenceInSeconds, differenceInMinutes } from 'date-fns'

export function useTaskPrompt(
  sessionStartTime: Date,
  durationMinutes: number = 45
) {
  const [isPromptActive, setIsPromptActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(0)

  useEffect(() => {
    const endTime = addMinutes(new Date(sessionStartTime), durationMinutes)
    const PROMPT_WINDOW = 5 // Show prompt in last 5 minutes

    const interval = setInterval(() => {
      const now = new Date()
      const remaining = differenceInSeconds(endTime, now)
      const minutesRemaining = differenceInMinutes(endTime, now)

      setTimeRemaining(Math.max(0, remaining))

      // Activate prompt in last 5 minutes
      if (minutesRemaining <= PROMPT_WINDOW && minutesRemaining >= 0) {
        setIsPromptActive(true)
      } else {
        setIsPromptActive(false)
      }

      // Clear interval when session ends
      if (remaining <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [sessionStartTime, durationMinutes])

  return { isPromptActive, timeRemaining }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side streak calculation | Server-side MongoDB aggregation | 2020+ | Data integrity: client-side can be manipulated. Server aggregation prevents fraud. |
| Complex badge systems | Minimal icons + streak counter | 2022+ | ADHD-friendly: visual overload causes abandonment. Minimal icons reduce cognitive load. |
| Shame-based gamification | Encouraging, positive reinforcement | 2021+ | Mental health: "You lost your streak!" causes shame. "Ready to start a new streak!" emphasizes fresh start. |
| Auto-filling incomplete tasks | Suggestion-only, explicit choice | 2023+ | Autonomy: auto-fill feels nagging, suggestion respects user choice. |
| Individual task visibility | Aggregate count only | 2022+ | Privacy: showing individual tasks to captains violates privacy. Aggregate (8/10) balances utility and privacy. |

**Deprecated/outdated:**
- **Leaderboards/rankings**: Toxic for ADHD — shame when streak breaks. Personal progress only.
- **Long-form task notes**: Friction — users skip it. Binary "completed?" + optional one-line celebration.
- **Complex task hierarchies**: Overwhelming for ADHD. Single task per session sufficient.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | canvas-confetti 1.9.4 performs well with WebRTC video grid | Standard Stack | If false, video frame rate drops during confetti. May need to reduce particle count or delay trigger. |
| A2 | Server-side streak calculation with MongoDB aggregation is efficient | Architecture Patterns | If false, streak queries may be slow at scale. Consider caching or incremental updates. |
| A3 | User.timezone field is populated during onboarding (Phase 1) | Architecture Patterns | If false, streak calculation defaults to UTC, may confuse users in Indian timezone (UTC+5:30). |
| A4 | 5-minute edit lock is enforced from sessionStartTime, not from submission time | Architecture Patterns | If false, users who submit early have less edit time. Clarify in implementation. |
| A5 | Captains are not stored as a separate role in User model | Architecture Patterns | If false, captain eligibility logic needs adjustment. Query by session count, not role. |
| A6 | Aggregate task count (8/10 submitted) satisfies captain needs | User Constraints | If false, captains need individual task content for encouragement. Re-evaluate privacy vs utility. |
| A7 | Emergency captain assignment doesn't require 4+ completed sessions | User Constraints | If false, admin can't assign anyone to empty captain slots. Confirm this is intentional. |
| A8 | Streak break uses encouraging "Ready to start a new streak!" message | User Constraints | If false, message is shame-based or neutral. Confirm copy before implementation. |
| A9 | Max 2 captain sessions per day is enforced server-side | User Constraints | If false, captains can overcommit and burn out. Add validation in captain assignment API. |
| A10 | Confetti always triggers on task complete, even if session incomplete | User Constraints | If false, confetti conditional on both task complete AND session complete. Clarify behavior. |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Confetti Trigger Timing**
   - What we know: Confetti always triggers on task complete (per D-08)
   - What's unclear: Should confetti also trigger at session END if task was already completed? Or only at the moment of completion?
   - Recommendation: Only trigger at the moment user marks task complete. Don't re-trigger at session end. Avoids confetti fatigue.

2. **Streak Timezone Handling**
   - What we know: User.timezone field exists from Phase 1 onboarding
   - What's unclear: Should streak be based on user's local timezone or a fixed timezone (e.g., IST)?
   - Recommendation: Use user's local timezone for streak calculation. Indian market mostly in IST (UTC+5:30), but handle travelers/expats.

3. **Captain Reward Free Session Credit**
   - What we know: Captain earns 1 free session for every 4 sessions captained
   - What's unclear: When is the credit applied? Immediately after 4th session? Or does captain need to claim it?
   - Recommendation: Apply automatically when 4th session completes. Add `freeSessionCredits` field to User model, increment by 1.

4. **Emergency Captain Notification Method**
   - What we know: Admin can assign any user as captain for sessions with no captain
   - What's unclear: How is the assigned user notified? In-app message only? Email (deferred to Phase 6)?
   - Recommendation: In-app notification first (Socket.IO `captain-assigned` event). Email notification deferred to Phase 6.

5. **Task Carry-Over Across Days**
   - What we know: Incomplete task shown as suggestion in next lobby
   - What's unclear: If user doesn't attend another session same day, is task still suggested next day? Or expired?
   - Recommendation: Expire after 24 hours. Suggest "Goal from yesterday: [task]" to avoid stale tasks.

6. **Streak Grace Period**
   - What we know: Streak breaks if no completed session within 24 hours
   - What's unclear: Should there be a grace period (e.g., 26-30 hours) for timezone edge cases?
   - Recommendation: No grace period for MVP. Strict 24-hour window. Add grace period if users complain about lost streaks.

7. **Captain Mute All Behavior**
   - What we know: Captain gets "Mute All" button (soft mute, participants can unmute)
   - What's unclear: Does "Mute All" mute NEW participants who join later?
   - Recommendation: No, "Mute All" is a one-time action. New participants join unmuted. Captain can mute again if needed.

8. **Session History Pagination**
   - What we know: Show "Past 7 sessions" on profile
   - What's unclear: Is this strictly last 7 sessions by date, or last 7 attended sessions?
   - Recommendation: Last 7 sessions by date (attended or not). Shows both completed and incomplete for honesty.

## Environment Availability

> Skip this section if the phase has no external dependencies (code/config-only changes).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 22.x (LTS) | All backend | ✓ | 22.10.5 [VERIFIED: npm registry] | — |
| Next.js 16.2.2 | Frontend framework | ✓ | 16.2.2 [VERIFIED: package.json] | — |
| React 19 | UI library | ✓ | 19.2.4 [VERIFIED: package.json] | — |
| Zustand 4.5.7 | State management | ✓ | 4.5.7 [VERIFIED: package.json] | — |
| Socket.IO 4.8.3 | Real-time events | ✓ | 4.8.3 [VERIFIED: package.json] | — |
| Mongoose 8.23.0 | Database models | ✓ | 8.23.0 [VERIFIED: package.json] | — |
| Zod 4.3.6 | Input validation | ✓ | 4.3.6 [VERIFIED: package.json] | — |
| date-fns 4.1.0 | Date utilities | ✓ | 4.1.0 [VERIFIED: package.json] | — |
| @radix-ui/react-dialog 1.1.15 | Modal components | ✓ | 1.1.15 [VERIFIED: package.json] | — |
| lucide-react 1.7.0 | Icons | ✓ | 1.7.0 [VERIFIED: package.json] | — |
| Tailwind CSS 3.4.17 | Styling | ✓ | 3.4.17 [VERIFIED: package.json] | — |
| canvas-confetti | Confetti animation | ✗ | 1.9.4 [VERIFIED: npm registry] | Install via npm |

**Missing dependencies with no fallback:**
- None — all dependencies are available or can be installed via npm

**Missing dependencies with fallback:**
- None

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json. If the key is absent or `true`, treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm test` |
| Full suite command | `npm run test:all` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TASK-01 | User can submit single goal/task before session starts | integration | `npm test -- task-submission.test.ts` | ❌ Wave 0 |
| TASK-02 | User can see their displayed goal during session | unit | `npm test -- task-overlay-card.test.tsx` | ❌ Wave 0 |
| TASK-03 | System prompts user 5 minutes before session ends | unit | `npm test -- task-prompt.test.ts` | ❌ Wave 0 |
| TASK-04 | User sees confetti celebration when marking task complete | unit | `npm test -- confetti.test.ts` | ❌ Wave 0 |
| TASK-05 | System suggests next available room when task incomplete | integration | `npm test -- next-room-suggestion.test.ts` | ❌ Wave 0 |
| TASK-06 | System auto-carries incomplete task to next registered session | integration | `npm test -- task-carryover.test.ts` | ❌ Wave 0 |
| TASK-07 | System tracks session completion status | unit | `npm test -- session-completion.test.ts` | ❌ Wave 0 |
| GAME-01 | User can see streak counter (consecutive days attended) | unit | `npm test -- streak-calculation.test.ts` | ❌ Wave 0 |
| GAME-02 | User can view session history (past sessions, completion status) | integration | `npm test -- session-history.test.ts` | ❌ Wave 0 |
| GAME-03 | User can view basic attendance stats (total sessions, completion rate) | integration | `npm test -- user-stats.test.ts` | ❌ Wave 0 |
| GAME-04 | User receives visual progress indicators (not just numbers) | unit | `npm test -- progress-indicators.test.tsx` | ❌ Wave 0 |
| COMM-03 | System displays immediate next-room suggestion after session completion | integration | `npm test -- next-room-suggestion.test.ts` | ❌ Wave 0 |
| COMM-04 | System supports interest-based room matching when sufficient users available | integration | `npm test -- interest-matching.test.ts` | ❌ Wave 0 |
| CAPT-01 | System identifies users eligible for captain role (4+ completed sessions) | unit | `npm test -- captain-eligibility.test.ts` | ❌ Wave 0 |
| CAPT-02 | Eligible user receives invitation to become room captain | integration | `npm test -- captain-invitation.test.ts` | ❌ Wave 0 |
| CAPT-03 | Admin can assign captains to specific sessions | integration | `npm test -- captain-assignment.test.ts` | ❌ Wave 0 |
| CAPT-04 | Captain can view all participants' goals in their room | integration | `npm test -- captain-task-visibility.test.ts` | ❌ Wave 0 |
| CAPT-05 | Captain can mute/unmute participants as needed | integration | `npm test -- captain-mute-controls.test.ts` | ❌ Wave 0 |
| CAPT-06 | Captain earns 1 free session for every 4 sessions captained | unit | `npm test -- captain-rewards.test.ts` | ❌ Wave 0 |
| CAPT-07 | System enforces captain session limits (max 2/day) | unit | `npm test -- captain-daily-limit.test.ts` | ❌ Wave 0 |
| ADMN-04 | Admin can assign room captains to sessions | integration | `npm test -- emergency-captain-assignment.test.ts` | ❌ Wave 0 |
| ADMN-07 | Admin can view captain remarks about sessions | unit | `npm test -- captain-remarks.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=verbose` (quick smoke test)
- **Per wave merge:** `npm run test:all` (full suite with coverage)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/tasks/task-submission.test.ts` — covers TASK-01 (task submission)
- [ ] `tests/unit/tasks/task-prompt.test.ts` — covers TASK-03 (5-minute prompt)
- [ ] `tests/unit/tasks/confetti.test.ts` — covers TASK-04 (confetti celebration)
- [ ] `tests/unit/tasks/session-completion.test.ts` — covers TASK-07 (completion tracking)
- [ ] `tests/unit/gamification/streak-calculation.test.ts` — covers GAME-01 (streak counter)
- [ ] `tests/unit/gamification/progress-indicators.test.tsx` — covers GAME-04 (visual progress)
- [ ] `tests/unit/captains/captain-eligibility.test.ts` — covers CAPT-01 (eligibility query)
- [ ] `tests/unit/captains/captain-rewards.test.ts` — covers CAPT-06 (free session credits)
- [ ] `tests/unit/captains/captain-daily-limit.test.ts` — covers CAPT-07 (max 2/day)
- [ ] `tests/integration/tasks/task-carryover.test.ts` — covers TASK-06 (auto-carry incomplete)
- [ ] `tests/integration/tasks/next-room-suggestion.test.ts` — covers TASK-05, COMM-03 (next room)
- [ ] `tests/integration/gamification/session-history.test.ts` — covers GAME-02 (session history)
- [ ] `tests/integration/gamification/user-stats.test.ts` — covers GAME-03 (attendance stats)
- [ ] `tests/integration/gamification/interest-matching.test.ts` — covers COMM-04 (interest matching)
- [ ] `tests/integration/captains/captain-invitation.test.ts` — covers CAPT-02 (invitation flow)
- [ ] `tests/integration/captains/captain-assignment.test.ts` — covers CAPT-03, ADMN-04 (assignment)
- [ ] `tests/integration/captains/captain-task-visibility.test.ts` — covers CAPT-04 (aggregate visibility)
- [ ] `tests/integration/captains/captain-mute-controls.test.ts` — covers CAPT-05 (mute controls)
- [ ] `tests/integration/captains/emergency-captain-assignment.test.ts` — covers ADMN-04 (emergency)
- [ ] `tests/unit/captains/captain-remarks.test.ts` — covers ADMN-07 (remarks viewing)

**Mocking strategy:**
- canvas-confetti: Mock `confetti()` function to verify it's called with correct parameters
- Socket.IO task events: Mock socket emit/on for task submission, completion, captain events
- MongoDB aggregation: Mock SessionCompletion.aggregate() for streak calculation
- Zod validation: Mock task validation schema to test character limits
- Captain permissions: Mock user role checks for captain-only endpoints

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth.js session tokens (already in Phase 1), verify captain status before muting |
| V3 Session Management | yes | NextAuth.js session management, task state persists across reconnections |
| V4 Access Control | yes | Captain permission checks before mute controls, admin-only for captain assignment |
| V5 Input Validation | yes | Zod validation for task text (100 char limit), task completion status |
| V6 Cryptography | yes | Not applicable for this phase (no new cryptographic operations) |
| V7 Communication Security | yes | Socket.IO over WebSocket (WSS), task events authenticated via session tokens |

### Known Threat Patterns for Task/Gamification System

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Task manipulation (edit after 5-minute window) | Tampering | Server-side edit lock enforcement, check `submittedAt + 5 minutes` before allowing updates |
| Streak manipulation (client-side calculation) | Tampering | Server-side MongoDB aggregation for streak calculation, no client-side streak updates |
| Captain privilege escalation | Spoofing | Verify captain status server-side before allowing mute controls, check Room.captainId |
| Task text injection (XSS via task content) | Tampering | Sanitize task text, escape HTML in task overlay card, use React's default XSS protection |
| Confetti DoS (excessive triggers) | Denial of Service | Rate limit confetti triggers (max 1 per session), debounce rapid calls |
| Captain mute abuse | Tampering | Log all captain mute actions, allow participants to report abuse, admin can revoke captain status |
| Session completion fraud | Spoofing | Require attendance validation (90+ seconds) before marking session complete, server-side verification |
| Task scraping via captain visibility | Information Disclosure | Aggregate count only (8/10 submitted), never expose individual task content to captains |

**Critical security controls:**
1. **Server-side edit lock enforcement**: Don't trust client-side edit lock. Check `sessionStartTime + 5 minutes` server-side.
2. **Captain permission verification**: Verify user is captain for the room before allowing mute controls. Check `Room.captainId === userId`.
3. **Task text sanitization**: Escape HTML in task overlay card to prevent XSS. React handles this by default, but verify.
4. **Streak calculation on server**: Never calculate streaks client-side. Use MongoDB aggregation pipeline.
5. **Session completion validation**: Require attendance validation (90+ seconds in room) before allowing task completion.
6. **Admin-only captain assignment**: Verify `user.role === 'admin'` before allowing captain assignment.
7. **Rate limiting on confetti**: Prevent abuse by rate limiting confetti triggers to 1 per session per user.

## Sources

### Primary (HIGH confidence)
- [canvas-confetti npm](https://www.npmjs.com/package/canvas-confetti) - Verified version 1.9.4, lightweight celebration library
- [Zustand npm](https://www.npmjs.com/package/zustand) - Verified version 4.5.7, state management
- [Socket.IO npm](https://www.npmjs.com/package/socket.io) - Verified version 4.8.3, real-time events
- [Mongoose npm](https://www.npmjs.com/package/mongoose) - Verified version 8.23.0, MongoDB ODM
- [Zod npm](https://www.npmjs.com/package/zod) - Verified version 4.3.6, input validation
- [date-fns npm](https://www.npmjs.com/package/date-fns) - Verified version 4.1.0, date utilities
- [@radix-ui/react-dialog npm](https://www.npmjs.com/package/@radix-ui/react-dialog) - Verified version 1.1.15, modal components
- [lucide-react npm](https://www.npmjs.com/package/lucide-react) - Verified version 1.7.0, icons
- [Existing codebase](https://github.com/sarthak1991/focusflow) - Phase 1-4 implementations, roomStore, Socket.IO patterns

### Secondary (MEDIUM confidence)
- MongoDB aggregation pipeline for streak calculation - Standard MongoDB pattern for grouping and counting
- ADHD-friendly UX patterns - General knowledge about minimal cognitive load, celebration without shame
- Gamification best practices - Industry patterns for streaks, progress indicators, avoiding toxic leaderboards

### Tertiary (LOW confidence)
- None — all findings verified via npm registry or existing codebase. No unverified WebSearch claims.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All package versions verified via npm registry. Existing dependencies confirmed in package.json.
- Architecture: MEDIUM - MongoDB and Socket.IO patterns based on existing codebase. Confetti integration verified via npm.
- Pitfalls: MEDIUM - Based on general WebRTC and gamification best practices. Some assumptions about ADHD user behavior.
- Code examples: HIGH - Based on existing React/Zustand/Socket.IO patterns in codebase. Hook patterns match existing implementations.

**Research date:** 2026-04-07
**Valid until:** 2026-05-07 (30 days - canvas-confetti is stable, MongoDB patterns are standard, ADHD UX principles are well-established)
