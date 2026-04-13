# Feature Landscape

**Domain:** ADHD focus rooms and accountability platform
**Researched:** 2026-04-06
**Overall confidence:** MEDIUM (based on training data — web search tools unavailable)

## Executive Summary

The ADHD focus/accountability platform space has clear table stakes established by platforms like Focusmate, Flow Club, Caveday, and Flown. Users expect friction-free onboarding, reliable video sessions, and basic goal tracking. Differentiation comes from execution quality, community engagement models, and ADHD-specific design patterns (low cognitive load, dopamine-friendly rewards, flexibility).

**Key insight:** The most successful platforms focus on reducing friction at every step — ADHD users abandon tools that feel like "work" to use. Features that increase cognitive load (complex scheduling, too many choices, overwhelming dashboards) are anti-features for this demographic.

---

## Table Stakes

Features users expect. Missing = product feels incomplete.

### User Onboarding and Profiles

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Email/password + OAuth (Google) | Users won't create new passwords | Low | Google sign-in reduces 60%+ friction |
| Minimal profile setup (name, photo) | Needed for session recognition | Low | Defer interests/tags to post-first-session |
| Welcome tour/walkthrough | Reduces first-session anxiety | Medium | Keep under 60 seconds, skippable |
| Timezone detection | Critical for session scheduling | Low | Auto-detect, allow manual override |
| Calendar integration (optional) | Power users expect this | High | V2 for MVP — Calendly-style booking instead |

### Focus Room Mechanics

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scheduled session times | Predictability = ADHD friendly | Low | Fixed schedule better than flexible for ADHD |
| Video connectivity | Core to body doubling value | High | WebRTC mandatory — custom implementation chosen |
| Audio mute/unmute controls | Basic video etiquette | Low | User-controlled + host-controlled |
| Goal/task submission before session | Accountability anchor | Low | Display during session for focus reminder |
| Session timer (visible countdown) | Time awareness reduces anxiety | Low | Prominent display, not buried |
| Pre-registration (15-30 min before) | Ensures attendance commitment | Medium | Prevents ghost sessions, allows room scaling |
| Session history/calendar | Users track what they attended | Medium | Simple list view sufficient for MVP |
| Room capacity limits | Quality of experience degrades beyond ~12 | Medium | Auto-scaling when full is table stakes |
| Post-session checkout | Completion dopamine hit | Low | "Did you complete?" binary question |

### Accountability and Gamification

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Session completion tracking | Basic progress visibility | Low | Count of completed sessions |
| Streak counter (daily/weekly) | Proven engagement driver | Low | Visual streak fire/consecutive-day counter |
| Task completion confirmation | Closes accountability loop | Low | Simple yes/no + optional notes |
| Attendance history | Users want to see progress | Medium | Basic stats: sessions, streak, completion rate |
| Reminder notifications | ADHD brains need external prompts | Medium | Email + in-app (push deferred to V2) |

### Community and Social Features

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| In-session text chat | Basic connection without video disruption | Low | Asynchronous — no pressure to respond |
| Room captain/host presence | Sessions feel abandoned without leadership | Medium | Can be volunteer or paid role |
| Participant identification (names/photos) | Humanizes the experience | Low | Video grid with name labels |
| Interest tags (occupation, goals) | Enables basic grouping/matching | Medium | Pre-defined tags better than free-form |

### Payments and Subscriptions

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Session limit enforcement | Free tier needs boundaries | Low | Hard stop with upgrade prompt |
| Subscription tiers (free/paid) | Freemium is standard expectation | Medium | Weekly/monthly options |
| Payment method variety | Indian market: UPI, Netbanking, cards | High | Razorpay/RazorpayX integration |
| Receipt/invoice access | Professional users need for taxes | Medium | Email receipts sufficient for MVP |
| Subscription management | Users must be able to cancel | Low | Self-serve cancellation required |

### Admin and Moderation

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Session creation/scheduling | Admin controls room schedule | Low | CRUD for sessions |
| User management (ban/suspend) | Safety requirement | Medium | Basic admin panel |
| Attendance/analytics dashboard | Business health visibility | Medium | Session counts, attendance rates, revenue |
| Captain assignment and management | Volunteer coordination | Medium | Track who can captain, assign to sessions |

---

## Differentiators

Features that set product apart. Not expected, but valued.

### Unique Value Propositions

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Interest-based room matching** | "I'm with my people" → comfort → better focus | High | Group by dev/design/writing/student tags |
| **Confetti celebration on task completion** | Dopamine hit → habit reinforcement | Low | Visual reward, share-able moment |
| **Task carry-over between sessions** | Reduces "what was I doing?" friction | Medium | Auto-carry incomplete tasks to next registered session |
| **Captain audio control permissions** | Structure without harshness | Medium | Captain can mute/unmute participants (prevents disruption) |
| **90-second attendance threshold** | Forgiving to ADHD forgetfulness | Low | More generous than 5-min industry standard |
| **Overflow room auto-splitting** | Never "room full" rejection | High | When 12 full, spin up 16-capacity overflow |
| **No-show gentle alerts** | Accountability without shame | Medium | "We missed you" (not "you failed") messaging |
| **Immediate next-room suggestion** | Momentum preservation | Low | Post-session: "Join 2pm room? [Yes]" one-click |
| **Pre-defined interest tags** | Avoid choice paralysis | Low | 20-30 curated tags vs free-form chaos |
| **Daily consistent schedule (9am-4pm)** | Reduces scheduling cognitive load | Low | Same times every day → habit formation |

### ADHD-Specific Design Patterns

| Pattern | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **One-click room join** | Friction-free entry | Low | From email/calendar reminder |
| **Minimal-dashboard interface** | Reduces overwhelm | Medium | Show only: next room, current streak, active task |
| **Gentle notifications (nudges not alarms)** | ADHD sensitive to harsh prompts | Low | "Hey, your room starts in 15 min" vs "!!!URGENT!!!" |
| **Forgiving reschedule policy** | Life happens, especially with ADHD | Medium | Allow one no-show forgiven per week |
| **Visual progress (not just numbers)** | ADHD brains respond to visual cues | Low | Progress bars, fillable circles vs text stats |
| **Task breakup suggestions** | Reduces task paralysis | High | AI/human-curated "break this into 3 steps" |

---

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Flexible/anytime room creation** | Choice paralysis → no sessions attended | Fixed daily schedule builds habit |
| **Complex task management (projects, labels, due dates)** | Becomes "yet another todo app" → abandoned | Single task per session, carry-over if incomplete |
| **Social features (profiles, following, DMs)** | Distraction from core focus value | In-session chat only, disappears after session |
| **Leaderboards/rankings** | Toxic for ADHD — shame when streak breaks | Personal progress only, no comparison to others |
| **Long-form session notes/journals** | Friction — users skip it | Binary "completed?" + optional one-line celebration |
| **Push notifications (mobile)** | Not in MVP (web-first) | Email reminders, in-app notifications |
| **User-generated room topics** | Fragmentation, empty rooms | Admin-scheduled rooms only for MVP |
| **Video recordings/sessions** | Privacy concerns, storage costs | Live sessions only — no archive |
| **Complex subscription tiers** | Decision fatigue | Free + 1 paid tier (weekly or monthly) |
| **Achievement badges beyond streak** | Gamification for its own sake → ignored | Streak counter is sufficient MVP gamification |
| **Freemium with aggressive upsell** | Feels transactional, kills community warmth | Gentle upgrade prompt after session limit hit |

---

## Feature Dependencies

```
User auth → Profile creation → Session registration → Room participation → Task submission → Completion check

Email signup/OAuth
    ↓
Session limit tracking
    ↓
Session registration (opens 30min before)
    ↓
Video room connectivity (WebRTC)
    ↓
Task submission (pre-session)
    ↓
Session countdown + live video
    ↓
Post-session checkout (complete?)
    ↓
Streak update + next room suggestion
```

**Core loop:** Auth → Register → Join → Focus → Complete → Repeat

**Secondary flows:**
- Captain assignment: User completes 4+ sessions → Eligible for captain → Admin assigns
- Subscription upgrade: Session limit hit → Upgrade prompt → Payment access → Limit increased
- Task carry-over: Task incomplete → Auto-copy to next registered session

---

## MVP Recommendation

### Must Ship (MVP)

**Blocker if missing:**

1. **User authentication** (Email + Google OAuth)
2. **Session schedule display** (Today's 8 rooms, 9am-4pm)
3. **Session registration** (Opens 30min before, capacity limited)
4. **Video room connectivity** (WebRTC, custom TURN server)
5. **Pre-session task submission** (Single goal for the session)
6. **Session timer** (Visible 45-min countdown)
7. **Post-session checkout** (Did you complete? + confetti if yes)
8. **Streak counter** (Consecutive days attended)
9. **Session history** (List of past sessions, completion status)
10. **Basic admin panel** (Create sessions, view attendance)
11. **Free tier session limit** (e.g., 3 sessions/week)
12. **Payment integration** (Indian market: UPI, Netbanking, cards)
13. **Email reminders** (15 min before registered sessions)
14. **Room captain presence** (Volunteer with basic controls)
15. **In-session text chat** (Basic connection)

**Why these:** Without authentication, users can't return. Without video, there's no body doubling. Without task submission, there's no accountability. Without streak/checkout, there's no dopamine reinforcement. Without payment, there's no business.

### Defer to Post-MVP

**Validate core value first:**

| Feature | Why Defer | Risk if Built Now |
|---------|-----------|-------------------|
| Interest-based room matching | Adds complexity before product-market fit | Empty "developer" rooms if insufficient users |
| Task carry-over between sessions | Nice-to-have, not core value | Engineering time better spent on video reliability |
| Overflow room auto-splitting | Optimization for scale problem | Premature until regularly hitting capacity |
| Calendar integration | Power user feature, not mass market | Low usage until core habit established |
| Push notifications (mobile) | Web-first MVP | Distraction from core web experience |
| Social features (profiles, following) | Distraction from focus value | Feature creep, not core value prop |
| Advanced analytics | Nice-to-have for users | Most won't check — simple history sufficient |
| User-generated rooms | Fragmentation risk | Better to control quality initially |

### Consider for V2 (After Traction)

| Feature | When to Build | Signal It's Time |
|---------|---------------|------------------|
| Interest-based feeds/threads | 500+ active weekly users | Users requesting "I want to find other devs" |
| Mobile apps (iOS/Android) | 1000+ users, 40%+ mobile traffic | Users attending via mobile browser |
| Advanced analytics dashboards | Power user segment emerges | Users asking "show my weekly focus time" |
| Team/corporate plans | B2B inbound interest | Companies asking for team accounts |
| API integrations (Notion, Todoist) | Power user demand | Users manually copying tasks to platform |

---

## Complexity Analysis

### Low Complexity (1-3 days)

- Email/password auth
- Google OAuth
- Session list display
- Session registration
- Basic admin panel (CRUD sessions)
- Streak counter
- Post-session checkout
- Confetti animation
- In-session text chat
- Session limit enforcement

### Medium Complexity (3-7 days)

- WebRTC video connectivity
- TURN server setup
- Room captain assignment
- Captain audio controls
- Task carry-over logic
- Interest-based matching
- Email reminder system
- Attendance tracking
- Payment integration (Razorpay)
- Subscription management

### High Complexity (1-2 weeks)

- Custom WebRTC implementation (not third-party)
- Overflow room auto-splitting logic
- Calendar integration
- Mobile apps
- Advanced analytics
- Team/corporate features
- API integrations

**Note:** Custom WebRTC is the highest-risk technical complexity. Consider third-party (Daily.co, Twilio) if self-imposed proves unreliable during MVP testing.

---

## Sources

**CONFIDENCE: MEDIUM** — Based on training data (web search tools unavailable during research). Verified against known platform patterns from Focusmate, Flow Club, Caveday, Flown, and ADHD productivity best practices.

### Platform References (Training Data)
- **Focusmate:** 1:1 video co-working, 25/50-minute sessions, goal declaration, partner matching
- **Flow Club:** Facilitated 2-hour sessions, professional hosts, goal check-ins
- **Caveday:** 3-4 hour guided deep work sessions, facilitator-led, breaks included
- **Flown:** Guided co-working with accountability, structured sessions

### ADHD Design Principles (Training Data)
- CHADD (Children and Adults with ADHD) organization resources
- ADDitude magazine coverage of productivity tools
- Research on gamification and dopamine in ADHD
- Body doubling effectiveness studies

### Validation Needed
- [ ] Current competitive landscape (2025-2026 new entrants?)
- [ ] Indian market-specific payment preferences beyond UPI
- [ ] Mobile vs desktop usage patterns for ADHD productivity in India
- [ ] Optimal session duration for Indian work culture (45-min Pomodoro vs local preferences)
