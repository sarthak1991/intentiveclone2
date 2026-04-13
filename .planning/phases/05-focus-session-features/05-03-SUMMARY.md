# Plan 05-03 Summary: Gamification - Streaks & History

**Completed:** 2026-04-08
**Plan:** 05-03 - Gamification: Streaks & History (GAME-01, GAME-02, GAME-03, GAME-04)

---

## What Was Implemented

### 1. Database Model

**src/models/Streak.ts**
- Streak tracking model with fields:
  - userId (ref User, required, unique)
  - currentStreak (number, default 0)
  - longestStreak (number, default 0)
  - lastSessionDate (Date, nullable)
- Compound unique index on userId

### 2. Server-Side Streak Calculation

**src/lib/streak.ts**
- `calculateStreak(userId, userTimezone)` function
  - Queries SessionCompletion for completed sessions
  - Groups by date using user's timezone
  - Calculates currentStreak by counting consecutive days from today backward
  - Streak breaks when gap > 1 day
  - Calculates longestStreak from entire history
  - Updates/creates Streak record in database
- `updateStreakAfterSession(userId, attendedAt)` helper function
- Returns StreakInfo with currentStreak, longestStreak, lastSessionDate, streakMessage
- Streak messages:
  - 0 streak: "Ready to start a new streak!"
  - 1 streak: "1 day streak! Keep it up!"
  - 2+ streak: "N day streak! Keep it up!"

### 3. API Endpoints

**src/app/api/streak/route.ts** (GET)
- Authenticates session
- Gets user's timezone from User model
- Calls calculateStreak with timezone
- Returns currentStreak, longestStreak, lastSessionDate, streakMessage

**src/app/api/user/stats/route.ts** (GET)
- Calculates totalSessions (count of Registration with status in ['attended', 'no-show'])
- Calculates completedTasks (count of SessionCompletion with completed=true)
- Calculates completionRate = (completedTasks / totalSessions * 100)
- Returns all stats including currentStreak and longestStreak

**src/app/api/user/history/route.ts** (GET)
- Fetches last 7 registrations for user
- Populates roomId and fetches corresponding SessionCompletion
- Returns sessions with id, roomTitle, scheduledTime, status, taskCompleted

### 4. React Hook

**src/hooks/useStreak.ts**
- `useStreak(userId)` hook
- State: streak, longestStreak, streakMessage, isLoading, error
- Fetches from /api/streak on mount
- Returns refresh() function for manual refetch
- Returns zero values when userId is null

### 5. UI Components

**src/components/profile/StreakBadge.tsx**
- Nav variant: Small badge with 🔥 emoji + streak number
  - Orange background (bg-orange-100, text-orange-700)
  - Rounded-full pill shape
- Card variant: Larger display with label and icon
- Hides when streak === 0 (avoid discouragement per D-09)
- Hides when loading

**src/components/profile/SessionHistory.tsx**
- Card with "Past 7 Sessions" title
- Lists each session with:
  - Status icon: ✓ (green) for completed, ○ (gray) for incomplete, ✗ (red) for no-show
  - Room title, date, time
  - Status badge (Completed/Incomplete/No-show)
- Empty state: "No sessions attended yet. Join your first focus room!"

**src/components/profile/AttendanceStats.tsx**
- Card with "Your Progress" title
- Grid layout (3 columns on desktop, 1 on mobile)
- 5 metrics with minimal icons:
  - 📅 Sessions Attended
  - ✅ Tasks Completed
  - 📊 Completion Rate
  - 🔥 Current Streak
  - 🏆 Longest Streak
- Includes StreakBadge (card variant) at bottom

**src/components/site/Navigation.tsx** (modified)
- Added import for StreakBadge
- Added StreakBadge in nav before user menu
- Shows 🔥 N to users with active streak

---

## Key Constraints Enforced

1. **Server-side calculation** - All streak calculations done in MongoDB aggregation, not client-side
2. **Timezone-aware** - Streak calculation uses user's timezone from User.timezone field
3. **Streak breaks correctly** - Gap > 1 day breaks the streak
4. **Hide zero streak** - StreakBadge doesn't show when streak === 0 (avoid discouragement)
5. **Minimal icons** - Simple emoji icons (📅, ✅, 📊, 🔥, 🏆) for ADHD-friendly display (per D-12)
6. **Past 7 sessions only** - SessionHistory limited to 7 sessions (per D-11)

---

## Verification

- [x] Streak model created with required fields
- [x] calculateStreak function uses MongoDB aggregation
- [x] Streak calculation timezone-aware
- [x] Streak breaks correctly when gap > 1 day
- [x] StreakBadge displays in navigation header
- [x] SessionHistory shows past 7 sessions with status icons
- [x] AttendanceStats displays 5 metrics with minimal design
- [x] All API endpoints require authentication

---

## Success Criteria (from PLAN.md)

1. [x] User sees 🔥 N badge in navigation when streak > 0
2. [x] Streak calculation accurate based on completed sessions
3. [x] "Ready to start a new streak!" message on streak break
4. [x] Session history shows past 7 sessions with status icons
5. [x] Attendance stats display total, completion rate, streaks
6. [x] All calculations done server-side
7. [x] Minimal icons used throughout (no visual overload)

**Status: COMPLETE**
