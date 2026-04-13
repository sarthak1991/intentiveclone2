# Phase 5: Focus Session Features - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 05-focus-session-features
**Areas discussed:** Task flow, Accountability, Gamification, Captain system

---

## Task Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Lobby modal | After registering, before joining video room. Dedicated screen with countdown | ✓ |
| In-room pre-session | Input field in video room with session start timer | |
| As part of registration | Registration form becomes task input | |

**User's choice:** Lobby modal

---

| Option | Description | Selected |
|--------|-------------|----------|
| Corner overlay card | Small card in corner, dismissible, not intrusive | |
| Persistent header strip | Above control bar, always visible | |
| Lobby only | Hidden during video session | |

**User's choice:** Corner overlay card which expands when you hover over it with details of the task you filled. Otherwise just the first 3-5 words only

**Notes:** User specified hover expansion behavior explicitly — keeps task visible but minimally intrusive.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Editable anytime | Can edit anytime during session | |
| First 5 min only | Editable during first 5 minutes, then locked | ✓ |
| Never editable | Locked once submitted | |

**User's choice:** First 5 min only

**Notes:** Balances flexibility with commitment. After 5 minutes, task is locked to prevent mid-session goal-shifting.

---

| Option | Description | Selected |
|--------|-------------|----------|
| 100 characters | Short and focused | ✓ |
| 200 characters | Medium length | |
| 300 characters | Longer form, multi-step goals | |

**User's choice:** 100 characters

**Notes:** Encourages single-task focus, prevents overwhelm for ADHD users.

---

## Accountability

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen modal | Blocks video, must answer | |
| Toast notification | Can dismiss, non-intrusive | |
| Task card highlight | Card pulses, clicking opens modal | ✓ |

**User's choice:** Task card highlight

**Notes:** Subtle but visible. Respects session flow, not intrusive.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Always suggest next | Auto-suggest next available room | |
| With 15+ min gap only | Suggest only if gap > 15 min | |
| Manual browse only | No auto-suggestion | ✓ |

**User's choice:** Manual browse only

**Notes:** Avoids nagging. User browses calendar and chooses themselves.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-fill with edit | Auto-fills task input, editable | |
| Show as suggestion | Shows previous goal, explicit choice | ✓ |
| No auto-carry | Each session starts fresh | |

**User's choice:** Show as suggestion

**Notes:** Displays "Previous goal: [task text]" that user can click to reuse or type new one.

---

## Gamification

| Option | Description | Selected |
|--------|-------------|----------|
| Always on complete | Every task completion gets confetti | ✓ |
| First of day only | First completion of day only | |
| Streak milestones | Only on streak records | |

**User's choice:** Always on complete

**Notes:** Reinforces achievement loop every time.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Profile + dashboard | On dedicated pages | |
| In lobby only | Before session starts | |
| Everywhere badge | Persistent nav badge | ✓ |

**User's choice:** Everywhere badge

**Notes:** 🔥 N badge in navigation header, always visible.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Encouraging restart | "Ready to start a new streak!" | ✓ |
| Soft acknowledgment | "Your streak ended..." | |
| Silent reset | Badge goes to 0 | |

**User's choice:** Encouraging restart

**Notes:** Neutral message, emphasizes fresh start not failure. Shame-free for ADHD users.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Calendar page | Calendar with green/yellow dots | |
| Recent list | Past 7 sessions list | ✓ |
| Profile summary only | Summary stats only | |

**User's choice:** Recent list

**Notes:** Simple "Past 7 sessions" on profile with status icons. Clean, no overwhelming calendar.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Visual everywhere | Rings, bars, badges | |
| Minimal icons | Text + simple icons | ✓ |
| Progress bar | Single bar | |

**User's choice:** Minimal icons

**Notes:** Text-based with icons, numbers, badges. Avoids visual overload for ADHD users.

---

## Captain System

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-identify + invite | System auto-invites eligible users | |
| Admin approval only | System identifies, admin reviews + invites | ✓ |
| Self-nomination | Users self-nominate | |

**User's choice:** Admin approval only with emergency assignment

**Notes:** System identifies eligible users (4+ sessions) but admin manually reviews and invites. **Special case:** For sessions with no assigned captain, admin can assign ANY user as captain regardless of completed sessions (emergency coverage).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Panel with task list | See all individual tasks | |
| Aggregate only | Task count only (8/10) | ✓ |
| Participant opt-in | Participants choose visibility | |

**User's choice:** Aggregate only

**Notes:** Captains see "8/10 participants submitted tasks" but NOT individual task content. Privacy-first.

---

| Option | Description | Selected |
|--------|-------------|----------|
| Mute All + individual | Both options available | ✓ |
| Individual only | Individual mute controls | |
| Mute All only | Only Mute All button | |

**User's choice:** Mute All + individual

**Notes:** Maximum flexibility. "Mute All" (soft, participants can unmute) + individual mute (stays muted).

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-apply silently | Invisible until user checks | |
| Show progress bar | "3/4 until free session!" | ✓ |
| No reward | Voluntary only | |

**User's choice:** Show progress bar

**Notes:** Gamifies captain role, provides tangible progress toward rewards.

---

## Claude's Discretion

None — user provided clear preferences for all decisions. No areas deferred to Claude's judgment.

---

## Deferred Ideas

None — discussion stayed within Phase 5 scope.
