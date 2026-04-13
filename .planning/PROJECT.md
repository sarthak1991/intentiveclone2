# FocusFlow - ADHD Focus Rooms

## What This Is

A web-based focus accountability platform for people with ADHD and focus challenges. Users join 45-minute video-based Pomodoro sessions (focus rooms) where they submit goals at the start, receive encouragement from room captains, and build momentum through structured accountability. Rooms run throughout the day (9am-4pm), scale automatically when full, and group participants by shared interests when possible.

## Core Value

People with ADHD can complete focused work sessions through community accountability and structured 45-minute Pomodoro intervals.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User authentication and profile creation
- [ ] Subscription system (weekly/monthly plans with session limits)
- [ ] Onboarding flow (interests, occupation, expertise via pre-defined tags)
- [ ] 8 daily focus rooms (9am-4pm), 45-minute Pomodoro sessions
- [ ] Video rooms using custom WebRTC implementation
- [ ] Room capacity: 12 participants, auto-scales to 16 with overflow split
- [ ] Task submission at session start (goals displayed on user's session page)
- [ ] Room captain system (community volunteers with 4+ completed sessions)
- [ ] Captain controls participant audio (mute/unmute permissions)
- [ ] Live text chat during sessions
- [ ] 5-minute completion check (task complete? → confetti / suggest next room)
- [ ] Task carry-over to next session if incomplete
- [ ] Calendar/list view of upcoming rooms
- [ ] Session registration (opens 30 min before start)
- [ ] Admin panel for super admin (room management, captain assignment)
- [ ] Email notifications (reminders, no-show alerts)
- [ ] Payment integration (UPI QR, Netbanking - Indian market)
- [ ] Session limit enforcement (upgrade prompt when exceeded)
- [ ] Attendance tracking (90+ seconds = attended)

### Out of Scope

- Interest-based feeds/threads — V2 (deferred to validate core concept first)
- Mobile apps (iOS/Android) — V2 (web-first MVP to validate traction)
- User-suggested special rooms — V2 (admin-scheduled rooms only for MVP)
- Social features beyond live chat — V2
- Advanced analytics — V2

## Context

**Founder experience:** Diagnosed with ADHD, building a tool that personally addresses the need for structured accountability and external motivation to complete focused work sessions.

**Problem being solved:** People with ADHD often struggle with:
- Starting tasks without external pressure
- Maintaining focus for extended periods
- Feeling isolated while working
- Lack of accountability for goals

**Solution approach:** 
- Borrow concepts from coworking spaces and body doubling
- Structure work into manageable 45-minute Pomodoro intervals
- Provide gentle accountability through room captains
- Build community around shared focus goals

**Market:** Indian market initially (UPI/Netbanking payments), targeted at professionals and students with ADHD or focus challenges.

## Constraints

- **Budget**: Keep deployment costs low — personal Digital Ocean VPS (app) + separate VPS for TURN server
- **Tech Stack**: Next.js (frontend), Node.js (backend), MongoDB with Prisma ORM, custom WebRTC (not third-party services), React Native for V2 mobile apps
- **Data Sovereignty**: Custom WebRTC implementation chosen over services like Twilio/Daily.co for control and data ownership
- **Deployment**: Self-hosted on personal infrastructure, not cloud-hosted services
- **Geography**: Indian market focus (UPI, Netbanking, Paytm)
- **Timeline**: MVP validation first — mobile apps and social features deferred until web traction proven

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Custom WebRTC vs. third-party service | Data sovereignty, control over user experience, avoid vendor lock-in | — Pending (technical complexity trade-off) |
| Web-only MVP | Validate core concept before investing in mobile development | — Pending (user feedback will confirm) |
| 8 daily rooms (9am-4pm) | Cover typical work hours, provide flexible session options | — Pending |
| Room captain model (volunteer community) | Reduce operational costs, build community engagement | — Pending |
| Task carry-over on incomplete | Reduce friction, maintain momentum across sessions | — Pending |
| 90-second attendance threshold | Balance no-show detection with legitimate drop-ins | — Pending |
| Pre-defined tags vs. free-form interests | Easier grouping, simpler UX, prevents fragmentation | — Pending |

---
*Last updated: 2026-04-06 after initialization*
