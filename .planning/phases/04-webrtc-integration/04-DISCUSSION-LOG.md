# Phase 4: WebRTC Integration - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-07
**Phase:** 4 - WebRTC Integration
**Areas discussed:** Video Grid Layout, Audio/Video Controls, Session Countdown Timer

---

## Video Grid Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-responsive grid | 1-3: Full-width rows. 4-6: 2x3 grid. 7-9: 3x3 grid. 10-12: 3x4 grid. Smoothly adapts as people join/leave. | ✓ |
| Fixed 12-slot grid | Fixed layout for all rooms. 12 slots always visible (even if empty). 3x4 or 4x3 grid. | |
| Claude's discretion | Choose based on what's easiest to implement and maintains good performance. | |

**User's choice:** Auto-responsive grid
**Notes:** User chose adaptive layout that responds to participant count. More elegant than fixed grid with empty slots.

### Speaker Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Automatic audio detection | Use WebRTC audio level detection. Border appears around loudest speaker. Automatic, no manual intervention. | |
| Manual raise hand | User raises hand (clicks button) to become "active speaker". Border shows on raised hand. Captain controls who's active. | |
| Hybrid approach | Both: Auto-detect audio, but users can also raise hand to override. Captain can manually highlight someone. | ✓ |

**User's choice:** Hybrid approach
**Notes:** Maximum flexibility. Automatic detection for natural flow, manual raise hand for override, captain control for facilitation.

### Border Style

| Option | Description | Selected |
|--------|-------------|----------|
| Simple solid border | 2px solid accent color (blue/green). Subtle but clear. No animation. Matches shadcn/ui focus rings. | ✓ |
| Animated pulse border | 3px border with pulse animation. Draws attention to speaker. May be distracting for ADHD users? | |
| Glowing border | 2px border with subtle glow (box-shadow). More elegant. Follows "elegant UI" preference from Phase 1. | |

**User's choice:** Simple solid border
**Notes:** Avoids animation distraction for ADHD users. Matches existing shadcn/ui component patterns.

---

## Audio/Video Controls

### Control Bar Buttons

| Option | Description | Selected |
|--------|-------------|----------|
| Mute button | Mute/unmute microphone. Required (VIDE-02). Shows mic icon when on, slashed when muted. | ✓ |
| Camera button | Toggle camera on/off. Shows camera icon when on, slashed when off. | ✓ |
| Leave button | Leave/exit room. Red button or prominent styling. Required for session exit. | ✓ |
| Settings button | Settings for audio/video devices (select mic, camera, speaker). Optional for MVP. | ✓ |

**User's choice:** All four buttons (Mute, Camera, Leave, Settings)
**Notes:** Complete control bar with all essential buttons. Settings included for device selection.

### Control Bar Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Always visible at bottom of video grid. No hiding. Users always see controls. Simpler for ADHD users. | ✓ |
| Auto-hide | Auto-hide after 5 seconds of inactivity. Reappears on mouse move. Less clutter, but requires discovery. | |

**User's choice:** Always visible
**Notes:** Reduces cognitive load and anxiety. ADHD users don't need to remember where controls are or discover them.

### Mute Visual Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Red background + icon change | Icon changes (mic → slashed mic). Button background turns red when muted. Clear visual cue. | ✓ |
| Icon change only | Icon changes only. No red background. Subtler. User might miss they're muted? | |
| Icon + overlay | Icon change + user's own video shows "Muted" overlay. Other participants see muted icon on their card. | |

**User's choice:** Red background + icon change
**Notes:** Clear visual cue that media is disabled. Red background provides immediate feedback.

### Captain Controls

| Option | Description | Selected |
|--------|-------------|----------|
| Tap card to mute | Captain clicks any participant's video card to mute/unmute them. Shows confirmation modal. Direct and clear. | |
| Mute all button | Captain clicks "Mute All" in control bar. Participants can unmute themselves. One action for entire room. | |
| Both options | Captain can tap individual cards OR use "Mute All". Maximum flexibility. | ✓ |

**User's choice:** Both options
**Notes:** Maximum flexibility for captains to handle different situations (disruptive individual vs. entire room).

---

## Session Countdown Timer

### Timer Format

| Option | Description | Selected |
|--------|-------------|----------|
| Just MM:SS | "42:15" - just the time. Clean, minimal. You know it's a countdown from context. | |
| "Session ends in" label | "Session ends in 42:15" - explicit label. No confusion what the timer means. | |
| "... remaining" | "42:15 remaining" - clear that it's counting down. Less wordy than "Session ends in". | ✓ |

**User's choice:** "... remaining"
**Notes:** Clear countdown indicator without being overly verbose. Less wordy than "Session ends in."

### Timer Color Change

| Option | Description | Selected |
|--------|-------------|----------|
| Red at 5 min | Accent color throughout session. Changes to red at 5:00 remaining. Clear urgency signal. | |
| Orange at 10, red at 5 | Accent color throughout. Changes to orange at 10:00, red at 5:00. Gradual urgency. | |
| No color change | Accent color throughout entire session. No color change. Consistent, less stressful. | ✓ |

**User's choice:** No color change
**Notes:** Avoids stress and anxiety for ADHD users. Consistent experience throughout session. No urgency signals.

---

## Claude's Discretion

### Connection Quality UI
**Decision made:** Use subtle status indicator (green/yellow/red dot next to user's name in header) with tooltip on hover showing connection details. No full-screen alerts or intrusive notifications. Silent reconnection in background.

**Rationale:** Minimize distraction and anxiety for ADHD users while providing visibility for troubleshooting. Existing reconnection handling from Phase 3 (useSocket with exponential backoff) provides resilience without user-facing alerts.

---

## Deferred Ideas

None — discussion stayed within Phase 4 scope. No new capabilities or features outside video/audio connectivity, controls, timer, and overflow rooms were introduced.
