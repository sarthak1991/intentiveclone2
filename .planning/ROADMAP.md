# Roadmap: FocusFlow

**Created:** 2026-04-06
**Granularity:** Standard (5-8 phases)
**Coverage:** 77/77 v1 requirements mapped

## Phases

- [x] **Phase 1: Foundation & Authentication** - Project setup, user auth, onboarding, and database schema (completed 2026-04-06)
- [x] **Phase 2: Room Management** - Room scheduling, listing, registration system, and basic admin controls (completed 2026-04-06)
- [x] **Phase 3: Real-Time Infrastructure** - WebSocket signaling, room presence, and live chat (completed 2026-04-07)
- [x] **Phase 4: WebRTC Integration** - Video/audio connectivity, TURN server, and SFU setup (completed 2026-04-07)
- [x] **Phase 5: Focus Session Features** - Tasks, timer, accountability flow, gamification, and captain system (completed 2026-04-08)
- [x] **Phase 6: Notifications** - Email reminders and no-show alerts (completed 2026-04-08)
- [ ] **Phase 7: Analytics & Operations** - Admin analytics, bandwidth monitoring, and production polish
- [ ] **Phase 8: Payments & Subscriptions** - Subscription tiers, Razorpay integration, and session limits

## Phase Details

### Phase 1: Foundation & Authentication

**Goal**: Users can create accounts, complete onboarding, and the technical foundation is ready for feature development.

**Depends on**: Nothing (first phase)

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, ONBD-01, ONBD-02, ONBD-03, ONBD-04, TECH-01, TECH-02, TECH-03

**Success Criteria** (what must be TRUE):

1. User can create account with email/password and log in across browser sessions
2. User can sign up with Google OAuth (reduces signup friction)
3. User can reset password via email link and log out from any page
4. User completes onboarding flow (name, photo, timezone, interests) with skippable tour
5. User's timezone is auto-detected with manual override option
6. Next.js 16.2.2 project with App Router is configured and deployable
7. MongoDB 7.0+ database is connected with Mongoose 8.x ORM and core schema defined

**Plans**: 5 plans

**Plan List**:
- [x] 01-01-PLAN.md — Initialize Next.js 16.2.2 project with App Router, TypeScript 5.x, Tailwind CSS 3.4+, shadcn/ui components, local MongoDB Docker setup, and Vitest testing framework
- [x] 01-02-PLAN.md — Create MongoDB connection layer using Mongoose 8.x, define User schema with GridFS support for profile photos, and implement singleton connection pattern
- [x] 01-03-PLAN.md — Implement complete authentication system using NextAuth.js 4.24.13 with three methods: email/password, Google OAuth, and magic links, with password reset and session management
- [x] 01-04-PLAN.md — Create multi-step onboarding wizard (4 steps) with profile photo upload, timezone detection with manual override, interest selection, and welcome screen
- [x] 01-05-PLAN.md — Create comprehensive test coverage for authentication and onboarding flows, polish error messages, verify middleware route protection, and create project documentation

**UI hint**: yes

---

### Phase 2: Room Management

**Goal**: Users can view scheduled rooms, register for sessions, and admins can manage the room schedule.

**Depends on**: Phase 1

**Requirements**: ROOM-01, ROOM-02, ROOM-03, ROOM-05, ADMN-01, ADMN-06, ADMN-08, TECH-04

**Success Criteria** (what must be TRUE):

1. User can view 8 daily scheduled rooms (9am-4pm) in calendar or list view
2. User can register for a room starting 30 minutes before session start
3. User can join registered room via one-click access
4. Admin can create/schedule rooms with time and capacity settings
5. Admin can manage no-show reassignments and add new interest tags
6. WebSocket signaling server (Socket.IO 4.8.3) is operational for real-time features

**Plans**: 7 plans

**Plan List**:
- [x] 02-01-PLAN.md — Create Room, Registration, and InterestTag MongoDB models with TypeScript interfaces, indexes, and validation
- [x] 02-02-PLAN.md — Create standalone Socket.IO 4.8.3 server with NextAuth JWT authentication and room namespaces for WebRTC signaling
- [x] 02-03-PLAN.md — Create room scheduling cron job, business logic for registration window and capacity checks, timezone utilities, and admin authorization helpers
- [x] 02-04-PLAN.md — Create REST API endpoints for room listing, room details, user registration/cancellation, admin room creation, and no-show management
- [x] 02-05-PLAN.md — Create user-facing room management UI components including room listing page, calendar/list view toggle, room cards with registration buttons, and one-click join functionality
- [x] 02-06-PLAN.md — Create admin panel UI components for room management including room creation form, room management panel with edit/cancel actions, no-show management interface, and interest tag manager
- [x] 02-07-PLAN.md — Create comprehensive integration tests for user and admin room management flows, build room detail page for pre-session lobby, update project documentation, and verify Phase 2 completion

**UI hint**: yes

---

### Phase 3: Real-Time Infrastructure

**Goal**: Real-time room state, presence system, and live text chat are operational before adding video complexity.

**Depends on**: Phase 2

**Requirements**: COMM-01, COMM-02

**Success Criteria** (what must be TRUE):

1. User can see other participants in their registered room (names, photos)
2. User can send and receive live text chat messages during session
3. Room state (participant count, capacity) updates in real-time across all clients
4. WebSocket connections handle reconnection gracefully without session loss
5. Room presence system accurately tracks who is in each room

**Plans**: 7 plans

**Plan List**:
- [x] 03-01-PLAN.md — Implement server-side presence tracking system with Map<roomId, Set<userId>> and 30-second heartbeat cleanup
- [x] 03-02-PLAN.md — Create ChatMessage MongoDB model with rate-limited chat event handlers (10 messages/minute)
- [x] 03-03-PLAN.md — Create Zustand store for real-time room state management and useSocket React hook for connection lifecycle
- [x] 03-04-PLAN.md — Create useRoomPresence React hook with heartbeat (15s) and automatic presence event handling
- [x] 03-05-PLAN.md — Create useRoomChat React hook, ParticipantList UI component, and ChatBox UI component with message history
- [x] 03-06-PLAN.md — Implement robust reconnection handling with state restoration, message deduplication, and exponential backoff
- [x] 03-07-PLAN.md — Create comprehensive testing documentation, Phase 3 implementation summary, and update project README

**UI hint**: yes

---

### Phase 4: WebRTC Integration

**Goal**: Users can connect to video rooms with reliable audio/video, including TURN server support for restrictive networks.

**Depends on**: Phase 3

**Requirements**: VIDE-01, VIDE-02, VIDE-03, VIDE-04, VIDE-05, VIDE-06, ROOM-04, ROOM-06, ROOM-07, ROOM-08, TECH-05, TECH-07

**Success Criteria** (what must be TRUE):

1. User can connect to video room and see other participants (names, photos in video grid)
2. User can control own audio mute/unmute
3. Room captain can control participant mute/unmute permissions
4. System handles TURN server connectivity for users behind restrictive NAT
5. System maintains reliable video connectivity for 12-person rooms
6. System enforces room capacity (12 participants) and auto-scales to 16 with overflow split
7. User can see visible 45-minute session countdown timer during video session
8. System validates attendance (90+ seconds in session = attended)

**Plans**: 7 plans

**Plan List**:
- [x] 04-01-PLAN.md — Set up mediasoup SFU server with worker, router, and WebRTC transport management
- [x] 04-02-PLAN.md — Deploy and configure coturn TURN server on separate VPS with REST API for dynamic credentials
- [x] 04-03-PLAN.md — Create WebRTC client hooks (useMediaStream, useWebRTCConnection) and React context for peer management
- [x] 04-04-PLAN.md — Implement producer/consumer logic for audio/video streams with mediasoup-client
- [x] 04-05-PLAN.md — Create video grid UI component with adaptive layout (1-12 participants) and participant cards
- [x] 04-06-PLAN.md — Implement room capacity enforcement, auto-scaling to overflow rooms, and attendance validation
- [x] 04-07-PLAN.md — Create comprehensive WebRTC integration tests, ICE configuration testing, and Phase 4 documentation

**UI hint**: yes

---

### Phase 5: Focus Session Features

**Goal**: Complete focus session experience with tasks, accountability, gamification, and captain system.

**Depends on**: Phase 4

**Requirements**: TASK-01, TASK-02, TASK-03, TASK-04, TASK-05, TASK-06, TASK-07, GAME-01, GAME-02, GAME-03, GAME-04, COMM-03, COMM-04, CAPT-01, CAPT-02, CAPT-03, CAPT-04, CAPT-05, CAPT-06, CAPT-07, ADMN-04, ADMN-07

**Success Criteria** (what must be TRUE):

1. User can submit single goal/task before session starts and see it displayed during session
2. User receives prompt 5 minutes before session end asking if task is complete
3. User sees confetti celebration when marking task complete
4. System suggests next available room when task incomplete and auto-carries incomplete task
5. User can view streak counter, session history, and attendance stats with visual progress indicators
6. System identifies eligible captains (4+ completed sessions) and sends invitations
7. Captain can view all participants' goals and mute/unmute participants as needed
8. Captain earns 1 free session for every 4 sessions captained (max 2/day)
9. Admin can assign captains to specific sessions and view captain remarks
10. System displays immediate next-room suggestion after session completion
11. System supports interest-based room matching when sufficient users available

**Plans**: 7 plans

**Plan List**:
- [x] 05-01-PLAN.md — Task submission & display (TASK-01, TASK-02, TASK-07)
- [x] 05-02-PLAN.md — Task completion flow with confetti (TASK-03, TASK-04, TASK-05, TASK-06, COMM-03)
- [x] 05-03-PLAN.md — Gamification: Streaks & History (GAME-01, GAME-02, GAME-03, GAME-04)
- [x] 05-04-PLAN.md — Captain eligibility & invitations (CAPT-01, CAPT-02, CAPT-03)
- [x] 05-05-PLAN.md — Captain controls & rewards (CAPT-04, CAPT-05, CAPT-06, CAPT-07)
- [x] 05-06-PLAN.md — Admin captain management (ADMN-04, ADMN-07)
- [x] 05-07-PLAN.md — Interest-based room matching (COMM-04)

**UI hint**: yes

---

### Phase 6: Notifications

**Goal**: Email reminders and no-show alerts are operational.

**Depends on**: Phase 5

**Requirements**: NOTF-01, NOTF-02, NOTF-03

**Success Criteria** (what must be TRUE):

1. User receives email reminder 15 minutes before registered session
2. User receives gentle no-show alert if missed registered session
3. All notification language uses gentle nudges, not alarms

**Plans**: 3 plans

**Plan List**:
- [x] 06-01-PLAN.md — Email reminder system (NOTF-01, NOTF-03)
- [x] 06-02-PLAN.md — No-show alert system (NOTF-02, NOTF-03)
- [x] 06-03-PLAN.md — Notification testing and documentation (NOTF-01, NOTF-02, NOTF-03)

**UI hint**: yes

---

### Phase 7: Analytics & Operations

**Goal**: Admin analytics dashboard, bandwidth monitoring, and production readiness polish.

**Depends on**: Phase 6

**Requirements**: ADMN-02, ADMN-03, ADMN-05, TECH-06

**Success Criteria** (what must be TRUE):

1. Admin can view attendance dashboard (session counts, attendance rates)
2. Admin can view basic analytics (revenue, active users)
3. Admin can manage users (ban/suspend)
4. System monitors TURN bandwidth usage and costs
5. System is production-ready with comprehensive error handling and logging

**Plans**: 7 plans

**Plan List**:
- [x] 07-01-PLAN.md — Admin navigation layout and overview dashboard (ADMN-02, ADMN-03)
- [x] 07-02-PLAN.md — Attendance analytics dashboard with time range filtering (ADMN-02)
- [x] 07-03-PLAN.md — User management with ban/suspend and audit logging (ADMN-05)
- [x] 07-04-PLAN.md — Bandwidth tracking model and API integration (TECH-06)
- [x] 07-05-PLAN.md — Bandwidth monitoring dashboard with alerts (TECH-06)
- [x] 07-06-PLAN.md — Production error handling and structured logging (TECH-06)
- [x] 07-07-PLAN.md — Documentation update and phase verification (ADMN-02, ADMN-03, ADMN-05, TECH-06)

**UI hint**: yes

---

### Phase 8: Payments & Subscriptions

**Goal**: Subscription tiers, payment processing, and session limit enforcement are operational.

**Depends on**: Phase 7

**Requirements**: PAYM-01, PAYM-02, PAYM-03, PAYM-04, PAYM-05, PAYM-06, PAYM-07, PAYM-08, PAYM-09, PAYM-10, PAYM-11

**Success Criteria** (what must be TRUE):

1. User can view subscription tiers (free, weekly, monthly) with transparent session limits
2. User can pay using UPI QR code, Netbanking, or credit/debit cards via Razorpay
3. System enforces session limits based on subscription tier with gentle upgrade prompts
4. User can self-serve cancel subscription
5. System unlocks room access after successful payment completion
6. User receives email receipt for payments

**Plans**: 7 plans

**UI hint**: yes

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 5/5 | Complete   | 2026-04-06 |
| 2. Room Management | 7/7 | Complete   | 2026-04-06 |
| 3. Real-Time Infrastructure | 7/7 | Complete   | 2026-04-07 |
| 4. WebRTC Integration | 7/7 | Complete   | 2026-04-07 |
| 5. Focus Session Features | 7/7 | Complete   | 2026-04-08 |
| 6. Notifications | 3/3 | Complete   | 2026-04-08 |
| 7. Analytics & Operations | 0/7 | Ready to execute | - |
| 8. Payments & Subscriptions | 0/7 | Not started | - |

## Coverage

| Category | Count | Phase(s) |
|----------|-------|----------|
| Authentication | 5 | Phase 1 |
| Onboarding & Profile | 4 | Phase 1 |
| Focus Rooms | 8 | Phase 2, 4 |
| Video & Audio (WebRTC) | 6 | Phase 4 |
| Tasks & Accountability | 7 | Phase 5 |
| Gamification & Progress | 4 | Phase 5 |
| Community & Social | 4 | Phase 3, 5 |
| Room Captains | 7 | Phase 5 |
| Notifications & Reminders | 3 | Phase 6 |
| Payments & Subscriptions | 11 | Phase 8 |
| Admin Panel | 8 | Phase 2, 5, 7 |
| Technical Infrastructure | 7 | Phase 1, 2, 4, 7 |

**Total v1 requirements:** 77
**Mapped to phases:** 77
**Unmapped:** 0

## Phase Dependencies

```
Phase 1: Foundation & Authentication
    ↓
Phase 2: Room Management
    ↓
Phase 3: Real-Time Infrastructure
    ↓
Phase 4: WebRTC Integration (Highest Risk)
    ↓
Phase 5: Focus Session Features
    ↓
Phase 6: Notifications
    ↓
Phase 7: Analytics & Operations
    ↓
Phase 8: Payments & Subscriptions
```

## Technical Risk Areas

**Phase 4 (WebRTC Integration)** is the highest-risk phase:
- Custom WebRTC implementation using mediasoup SFU
- TURN server deployment on separate VPS
- ICE configuration for NAT traversal
- 12-person video connectivity reliability

**Mitigation strategy:**
- Comprehensive ICE configuration with multiple STUN/TURN servers
- Bandwidth monitoring from day one
- Test on multiple networks before launch
- Connection state monitoring and diagnostics

---
*Roadmap created: 2026-04-06*
*Last updated: 2026-04-08*
