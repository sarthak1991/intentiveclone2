# Requirements: FocusFlow

**Defined:** 2026-04-06
**Core Value:** People with ADHD can complete focused work sessions through community accountability and structured 45-minute Pomodoro intervals.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can create account with email/password
- [x] **AUTH-02**: User can sign up with Google OAuth (reduces 60% friction)
- [x] **AUTH-03**: User can log in and stay logged in across sessions
- [x] **AUTH-04**: User can log out from any page
- [x] **AUTH-05**: User can reset password via email link

### Onboarding & Profile

- [x] **ONBD-01**: User completes minimal profile setup (name, photo, timezone)
- [x] **ONBD-02**: User selects interests from pre-defined tags (occupation, goals, expertise level)
- [x] **ONBD-03**: User receives welcome tour (under 60 seconds, skippable)
- [x] **ONBD-04**: User's timezone is auto-detected with manual override option

### Focus Rooms

- [x] **ROOM-01**: User can view 8 daily scheduled rooms (9am-4pm)
- [x] **ROOM-02**: User can toggle between calendar view and list view of rooms
- [x] **ROOM-03**: User can register for a room starting 30 minutes before session start
- [ ] **ROOM-04**: System enforces room capacity limit (12 participants, auto-scales to 16 with overflow split)
- [x] **ROOM-05**: User can join registered room via one-click access
- [ ] **ROOM-06**: User can see visible 45-minute session countdown timer
- [ ] **ROOM-07**: System manages overflow room splitting when capacity exceeded (first 12 in main room, last 4 in overflow with unique identifier)
- [ ] **ROOM-08**: System validates attendance (90+ seconds in session = attended)

### Video & Audio (WebRTC)

- [x] **VIDE-01**: User can connect to video room using custom WebRTC implementation (mediasoup SFU)
- [x] **VIDE-02**: User can control own audio mute/unmute
- [ ] **VIDE-03**: Room captain can control participant mute/unmute permissions
- [ ] **VIDE-04**: User can see participant names and photos in video grid
- [ ] **VIDE-05**: System handles TURN server connectivity for users behind restrictive NAT
- [x] **VIDE-06**: System maintains reliable video connectivity for 12-person rooms

### Tasks & Accountability

- [ ] **TASK-01**: User can submit single goal/task before session starts
- [ ] **TASK-02**: User can see their displayed goal during session
- [ ] **TASK-03**: System prompts user 5 minutes before session ends: "Is your task complete?"
- [ ] **TASK-04**: User sees confetti celebration when marking task complete
- [ ] **TASK-05**: System suggests next available room when task incomplete (with 15+ min gap)
- [ ] **TASK-06**: System auto-carries incomplete task to next registered session
- [ ] **TASK-07**: System tracks session completion status (complete/incomplete)

### Gamification & Progress

- [ ] **GAME-01**: User can see streak counter (consecutive days attended)
- [ ] **GAME-02**: User can view session history (past sessions, completion status)
- [ ] **GAME-03**: User can view basic attendance stats (total sessions, completion rate)
- [ ] **GAME-04**: User receives visual progress indicators (not just numbers)

### Community & Social

- [ ] **COMM-01**: User can participate in live text chat during session
- [ ] **COMM-02**: User can see other participants in room (names, photos)
- [ ] **COMM-03**: System displays immediate next-room suggestion after session completion
- [ ] **COMM-04**: System supports interest-based room matching when sufficient users available

### Room Captains

- [ ] **CAPT-01**: System identifies users eligible for captain role (4+ completed sessions)
- [ ] **CAPT-02**: Eligible user receives invitation to become room captain
- [ ] **CAPT-03**: Admin can assign captains to specific sessions
- [ ] **CAPT-04**: Captain can view all participants' goals in their room
- [ ] **CAPT-05**: Captain can mute/unmute participants as needed
- [ ] **CAPT-06**: Captain earns 1 free session for every 4 sessions captained
- [ ] **CAPT-07**: System enforces captain session limits (max 2/day to prevent burnout)

### Notifications & Reminders

- [ ] **NOTF-01**: User receives email reminder 15 minutes before registered session
- [ ] **NOTF-02**: User receives gentle no-show alert if missed registered session
- [ ] **NOTF-03**: System sends gentle notification language (nudges, not alarms)

### Payments & Subscriptions

- [ ] **PAYM-01**: User can view subscription tiers (free tier with session limits, weekly paid, monthly paid)
- [ ] **PAYM-02**: User can pay using UPI QR code
- [ ] **PAYM-03**: User can pay using Netbanking
- [ ] **PAYM-04**: User can pay using credit/debit cards
- [ ] **PAYM-05**: System enforces session limits based on subscription tier
- [ ] **PAYM-06**: User sees transparent session limit communication before registration
- [ ] **PAYM-07**: User receives gentle upgrade prompt when session limit exceeded
- [ ] **PAYM-08**: User can self-serve cancel subscription
- [ ] **PAYM-09**: System processes payments via Razorpay
- [ ] **PAYM-10**: User receives email receipt for payments
- [ ] **PAYM-11**: System unlocks room access after successful payment completion

### Admin Panel

- [x] **ADMN-01**: Admin can create/schedule rooms (time, capacity)
- [ ] **ADMN-02**: Admin can view attendance dashboard (session counts, attendance rates)
- [ ] **ADMN-03**: Admin can view basic analytics (revenue, active users)
- [ ] **ADMN-04**: Admin can assign room captains to sessions
- [ ] **ADMN-05**: Admin can manage users (ban/suspend)
- [x] **ADMN-06**: Admin can reassign no-show slots to waiting users
- [ ] **ADMN-07**: Admin can view captain remarks about sessions
- [x] **ADMN-08**: Admin can add new interest tags to system

### Technical Infrastructure

- [x] **TECH-01**: System runs on Next.js 16.2.2 frontend with App Router
- [x] **TECH-02**: System runs on Node.js 22.x backend
- [x] **TECH-03**: System uses MongoDB 7.0+ database with Mongoose 8.x ORM
- [x] **TECH-04**: System implements WebSocket signaling via Socket.IO 4.8.3
- [x] **TECH-05**: System deploys TURN server on separate VPS for WebRTC connectivity
- [ ] **TECH-06**: System monitors TURN bandwidth usage and costs
- [ ] **TECH-07**: System implements proper WebRTC ICE configuration with multiple STUN/TURN servers

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Mobile & Social

- **MOBL-01**: iOS and Android mobile apps (React Native)
- **MOBL-02**: Push notifications for session reminders
- **SOCL-01**: Interest-based feeds/threads
- **SOCL-02**: User profile pages and following
- **SOCL-03**: Direct messaging between users

### Advanced Features

- **FEAT-01**: User-suggested special rooms
- **FEAT-02**: Calendar integration (Google Calendar, etc.)
- **FEAT-03**: Advanced analytics dashboards (weekly focus time, productivity insights)
- **FEAT-04**: Team/corporate plans and billing
- **FEAT-05**: API integrations (Notion, Todoist, etc.)
- **FEAT-06**: Task breakup suggestions (AI/human-curated)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Flexible/anytime room creation | Choice paralysis → no sessions attended. Fixed daily schedule builds habit |
| Complex task management (projects, labels, due dates) | Becomes "yet another todo app" → abandoned. Single task per session sufficient |
| Social features (profiles, following, DMs) in MVP | Distraction from core focus value. In-session chat only for MVP |
| Leaderboards/rankings | Toxic for ADHD — shame when streak breaks. Personal progress only |
| Long-form session notes/journals | Friction — users skip it. Binary "completed?" + optional one-line celebration |
| Video recordings/sessions | Privacy concerns, storage costs. Live sessions only — no archive |
| Complex subscription tiers | Decision fatigue. Free + 1-2 paid tiers (weekly or monthly) |
| Achievement badges beyond streak | Gamification for its own sake → ignored. Streak counter sufficient |
| Third-party video services (Twilio, Daily.co) | Data sovereignty requirement. Custom WebRTC for control |
| Freemium with aggressive upsell | Feels transactional, kills community warmth. Gentle upgrade prompt only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| ONBD-01 | Phase 1 | Complete |
| ONBD-02 | Phase 1 | Complete |
| ONBD-03 | Phase 1 | Complete |
| ONBD-04 | Phase 1 | Complete |
| TECH-01 | Phase 1 | Complete |
| TECH-02 | Phase 1 | Complete |
| TECH-03 | Phase 1 | Complete |
| ROOM-01 | Phase 2 | Complete |
| ROOM-02 | Phase 2 | Complete |
| ROOM-03 | Phase 2 | Complete |
| ROOM-05 | Phase 2 | Complete |
| ADMN-01 | Phase 2 | Complete |
| ADMN-06 | Phase 2 | Complete |
| ADMN-08 | Phase 2 | Complete |
| TECH-04 | Phase 2 | Complete |
| COMM-01 | Phase 3 | Pending |
| COMM-02 | Phase 3 | Pending |
| VIDE-01 | Phase 4 | Complete |
| VIDE-02 | Phase 4 | Complete |
| VIDE-03 | Phase 4 | Pending |
| VIDE-04 | Phase 4 | Pending |
| VIDE-05 | Phase 4 | Pending |
| VIDE-06 | Phase 4 | Complete |
| ROOM-04 | Phase 4 | Pending |
| ROOM-06 | Phase 4 | Pending |
| ROOM-07 | Phase 4 | Pending |
| ROOM-08 | Phase 4 | Pending |
| TECH-05 | Phase 4 | Complete |
| TECH-07 | Phase 4 | Pending |
| TASK-01 | Phase 5 | Pending |
| TASK-02 | Phase 5 | Pending |
| TASK-03 | Phase 5 | Pending |
| TASK-04 | Phase 5 | Pending |
| TASK-05 | Phase 5 | Pending |
| TASK-06 | Phase 5 | Pending |
| TASK-07 | Phase 5 | Pending |
| GAME-01 | Phase 5 | Pending |
| GAME-02 | Phase 5 | Pending |
| GAME-03 | Phase 5 | Pending |
| GAME-04 | Phase 5 | Pending |
| COMM-03 | Phase 5 | Pending |
| COMM-04 | Phase 5 | Pending |
| CAPT-01 | Phase 5 | Pending |
| CAPT-02 | Phase 5 | Pending |
| CAPT-03 | Phase 5 | Pending |
| CAPT-04 | Phase 5 | Pending |
| CAPT-05 | Phase 5 | Pending |
| CAPT-06 | Phase 5 | Pending |
| CAPT-07 | Phase 5 | Pending |
| ADMN-04 | Phase 5 | Pending |
| ADMN-07 | Phase 5 | Pending |
| PAYM-01 | Phase 6 | Pending |
| PAYM-02 | Phase 6 | Pending |
| PAYM-03 | Phase 6 | Pending |
| PAYM-04 | Phase 6 | Pending |
| PAYM-05 | Phase 6 | Pending |
| PAYM-06 | Phase 6 | Pending |
| PAYM-07 | Phase 6 | Pending |
| PAYM-08 | Phase 6 | Pending |
| PAYM-09 | Phase 6 | Pending |
| PAYM-10 | Phase 6 | Pending |
| PAYM-11 | Phase 6 | Pending |
| NOTF-01 | Phase 6 | Pending |
| NOTF-02 | Phase 6 | Pending |
| NOTF-03 | Phase 6 | Pending |
| ADMN-02 | Phase 7 | Pending |
| ADMN-03 | Phase 7 | Pending |
| ADMN-05 | Phase 7 | Pending |
| TECH-06 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 77 total
- Mapped to phases: 77
- Unmapped: 0

---
*Requirements defined: 2026-04-06*
*Last updated: 2026-04-06 after roadmap creation*
