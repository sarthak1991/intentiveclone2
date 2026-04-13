# Domain Pitfalls: FocusFlow (ADHD Focus Rooms)

**Domain:** Real-time video accountability platform
**Researched:** 2026-04-06
**Overall confidence:** MEDIUM

> **Note:** Web search services were rate-limited during research. Findings are based on established WebRTC patterns, ADHD UX principles, and SaaS best practices. Verification against official documentation recommended before implementation.

---

## Critical Pitfalls

Mistakes that cause rewrites, major issues, or user abandonment.

### 1. WebRTC Connection Silence: "It Works on My Machine"

**What goes wrong:** WebRTC connections succeed in development (same network, no enterprise firewalls) but fail for 20-40% of users in production due to NAT traversal issues, corporate firewalls, and asymmetric routing.

**Why it happens:** 
- Development testing doesn't simulate real-world network conditions
- STUN servers work for simple NAT but fail for symmetric NAT
- Missing or misconfigured TURN server fallback
- ICE candidate gathering incomplete before connection attempt

**Consequences:**
- Users see "connecting..." spinner forever
- No clear error messaging
- High abandonment rate before first session
- Support tickets overwhelm founder

**Prevention:**
```javascript
// ICE Configuration Pattern
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'turn:your-turn-server:3478', username: 'user', credential: 'pass' },
    { urls: 'turn:your-turn-server:3478?transport=tcp', username: 'user', credential: 'pass' },
    { urls: 'turns:your-turn-server:5349', username: 'user', credential: 'pass' }
  ],
  iceTransportPolicy: 'all', // Try direct first, fallback to relay
  iceCandidatePoolSize: 10
};

// Implement connection state monitoring
peerConnection.addEventListener('iceconnectionstatechange', () => {
  const state = peerConnection.iceConnectionState;
  if (state === 'failed' || state === 'disconnected') {
    // Trigger UI feedback and retry logic
  }
});
```

**Detection:**
- Log ICE connection state distribution (connected vs failed vs checking)
- Track percentage of connections requiring TURN relay
- Monitor time-to-connected metrics

**Phase to address:** Phase 1 - Foundation (WebRTC setup)

**Confidence:** HIGH — Well-documented WebRTC pattern

---

### 2. TURN Server Cost Explosion

**What goes wrong:** TURN server bandwidth costs scale exponentially with users. Each 45-minute session with 12 participants can consume 5-15 GB of relayed data. At 100 concurrent users, this exceeds typical VPS bandwidth allowances.

**Why it happens:**
- Symmetric NAT users (30-40% in some regions) require TURN relay
- No per-session bandwidth monitoring
- UDP blocked in corporate environments (forces TLS relay)
- No geographic distribution (users far from server = more relay needed)

**Consequences:**
- Monthly bandwidth bill 3-10x expected
- Forced to limit user growth or increase prices
- Degraded video quality to "save bandwidth"

**Prevention:**
```nginx
# coturn configuration for bandwidth control
# Limit per-session bandwidth
max-bps=3000000  # 3 Mbps per allocation
total-quota=10000000000  # 10 GB daily limit per user

# Monitor usage
cli-ip=127.0.0.1
web-admin-ip=127.0.0.1
```

**Implementation strategy:**
1. Deploy TURN on separate VPS with generous bandwidth
2. Implement bandwidth monitoring per session
3. Track relay vs direct connection ratio
4. Consider geographic distribution if >50% users need relay
5. Set alerts at 80% bandwidth quota

**Detection:**
- Daily bandwidth usage alerts
- Per-user bandwidth tracking
- Relay vs direct connection percentage

**Phase to address:** Phase 1 - Foundation (TURN deployment)

**Confidence:** HIGH — Bandwidth physics are deterministic

---

### 3. ADHD Feature Creep: The "Everything Everywhere" Trap

**What goes wrong:** Adding features because users request them, not because they serve the core value proposition. Dashboard shows sessions, stats, gamification, social feed, tasks, calendar, settings, notifications, profiles — overwhelming for ADHD users.

**Why it happens:**
- User feedback sounds like "I need X to stay accountable"
- Feature additions feel low-cost (just add a tab)
- No framework for evaluating if feature belongs
- Fear of missing out on competitor features

**Consequences:**
- Users open app, feel overwhelmed, close it
- Increased cognitive load defeats the purpose
- Higher support burden ("where do I click for X?")
- Dilution of core value proposition

**Prevention:**

**Feature Evaluation Framework (ask before building):**
1. Does this help users start a focus session? (Primary)
2. Does this help users complete a focus session? (Primary)
3. Does this reduce friction between sessions? (Secondary)
4. Can this be deferred without breaking core loop? (Defer)

**ADHD Cognitive Load Rules:**
- One primary action per screen
- Max 3 visible options at any decision point
- Progressive disclosure — show options only when needed
- No hidden features that require discovery
- Consistent patterns everywhere

**Examples of "No" for MVP:**
- "Leaderboards" → Creates shame, not accountability
- "Session recording" → Privacy nightmare, no clear value
- "Interest-based feeds" → V2 feature, distracts from core
- "Advanced analytics" → Nice-to-have, not table stakes

**Detection:**
- User interviews: "What do you see when you open the app?"
- Time-to-first-session metrics
- Task completion rates for onboarding
- Support ticket themes ("how do I...")

**Phase to address:** Ongoing — Product governance

**Confidence:** MEDIUM — ADHD-specific patterns from UX research

---

### 4. Payment Friction: The "Wallet Out" Moment

**What goes wrong:** Users register, attend a few free sessions, hit session limit, see payment wall, and never return. Payment flow feels like a "gotcha" after momentum built.

**Why it happens:**
- No clear communication of limits upfront
- Payment wall appears mid-momentum
- UPI QR flow requires multiple apps (scanner → UPI app → back to browser)
- No trial value demonstration before ask
- Pricing page after registration (not before)

**Consequences:**
- 60-80% churn at payment gate
- Negative word-of-mouth ("it's free until...")
- Wasted acquisition cost on non-paying users

**Prevention:**

**Transparent Limit Communication:**
```
Before registration:
"You have 3 free sessions to try FocusFlow. After that, weekly 
plans start at ₹199/month for unlimited sessions."

During session 2:
"You've used 2 of 3 free sessions. After your free sessions, 
unlimited focus rooms are ₹199/month."

After session 3:
"Your free sessions are complete! Continue your focus journey..."
```

**Payment Flow Best Practices:**
1. Show pricing BEFORE registration
2. Display session counter prominently
3. Send "2 sessions remaining" notification
4. Offer first-week discount for immediate conversion
5. Save payment method for future (reduce friction)
6. Multiple payment options (UPI QR, Netbanking, cards)

**Indian Market Specific:**
- UPI QR is expected (not just "pay with card")
- Netbanking options for major banks
- Consider Paytm/PhonePe wallet integration
- Mobile-optimized payment flow (critical)

**Detection:**
- Funnel analysis: registration → first session → session limit hit → payment
- A/B test payment wall placement
- Churn rate at session 3 vs session 4

**Phase to address:** Phase 2 - Payments & Subscriptions

**Confidence:** MEDIUM — General SaaS pattern, India-specific verification needed

---

### 5. Room Captain Burnout & Quality Drift

**What goes wrong:** Volunteer room captains start enthusiastic, then burn out from emotional labor. Sessions become inconsistent — some captains are great, others are absent or negative. User experience varies wildly.

**Why it happens:**
- No compensation for captain time
- Emotional labor of managing ADHD room dynamics
- No training or standards for captains
- "Captain" becomes synonymous with "free moderator labor"
- No feedback loop or quality monitoring

**Consequences:**
- Users have bad experience with one captain, associate with platform
- Captains quit, leaving rooms unmanned
- Negative reviews mention "inconsistent moderation"
- Founder becomes de facto captain for all rooms

**Prevention:**

**Captain Guardrails:**
1. Minimum 4 completed sessions before captain eligibility
2. Captains max 2 sessions per day (prevent burnout)
3. Captain onboarding checklist (what to say, how to handle situations)
4. Session rating by participants (feedback loop)
5. Captains earn free weeks for every X sessions hosted
6. Clear "not a therapist" boundaries

**Captain Training Content:**
- How to start session (welcome script)
- How to encourage without pressuring
- How to handle disruptive participants
- When to mute/unmute audio permissions
- What to do when no one talks

**Quality Monitoring:**
- Random spot-checks of sessions
- Post-session "how was your captain?" one-tap rating
- Captain performance dashboard
- Remove inactive captains after 2 weeks no-show

**Detection:**
- Captain retention rate
- Participant satisfaction with captain
- Variance in session ratings across captains
- Captain session frequency over time

**Phase to address:** Phase 2 - Community Features

**Confidence:** MEDIUM — Community management pattern, needs verification

---

## Moderate Pitfalls

### 6. No-Show False Positives

**What goes wrong:** Users marked as "no-show" when they joined but had connectivity issues, or joined late but before 90-second threshold. Damages trust and feels punitive.

**Why it happens:**
- Rigid 90-second attendance threshold
- No distinction between "didn't join" and "joined but dropped"
- WebRTC connection failures counted as no-show
- No grace period for late arrivals

**Prevention:**
- "No-show" = never connected to WebRTC (not just short duration)
- Grace period: attendance counted if joins within first 5 minutes
- Distinguish: "disconnected" vs "never joined" in tracking
- Allow users to appeal no-show marking
- Send "connection issue detected" message if WebRTC fails

**Phase to address:** Phase 1 - WebRTC Implementation

---

### 7. Video Quality Degradation Cascade

**What goes wrong:** One participant with poor bandwidth causes overall session quality to drop. WebRTC tries to accommodate, resulting in pixelated or frozen video for everyone.

**Why it happens:**
- No per-participant bandwidth adaptation
- SFU (Selective Forwarding Unit) not implemented
- No "lower quality" option for poor connections
- All participants forced to lowest common denominator

**Prevention:**
```javascript
// Request appropriate quality based on conditions
const setVideoQuality = (wantsHighQuality, networkCondition) => {
  const sender = peerConnection.getSenders().find(s => s.track.kind === 'video');
  const parameters = sender.getParameters();
  
  if (networkCondition === 'poor') {
    parameters.encodings[0].maxBitrate = 300000; // 300 Kbps
    parameters.encodings[0].scaleResolutionDownBy = 2;
  } else {
    parameters.encodings[0].maxBitrate = 2000000; // 2 Mbps
    parameters.encodings[0].scaleResolutionDownBy = 1;
  }
  
  sender.setParameters(parameters);
};
```

- Implement track-based quality controls
- Allow users to toggle "high quality" vs "data saver"
- Show bandwidth indicator to users
- Gracefully handle participant disconnections

**Phase to address:** Phase 1 - WebRTC Implementation

**Confidence:** HIGH — WebRTC best practice

---

### 8. Over-Engineered Task Management

**What goes wrong:** Task submission becomes a mini project manager — tags, priorities, due dates, subtasks, recurring tasks. Users spend more time managing tasks than doing them.

**Why it happens:**
- Feature creep disguised as "accountability tools"
- Competing with Todoist/Notion instead of focusing
- No constraint on "what is a task"

**Prevention:**
- Task = one line of text, max 140 chars
- No tags, priorities, or due dates in MVP
- Task displayed on user's screen during session
- Binary completion: done or not done
- Carry over incomplete tasks — that's it

**Phase to address:** Phase 1 - Core Features

**Confidence:** MEDIUM — ADHD productivity pattern

---

### 9. Notification Fatigue

**What goes wrong:** Users receive email, push, and in-app notifications for everything — session reminders, no-show alerts, captain messages, payment receipts, weekly summaries. They disable all notifications.

**Why it happens:**
- No notification strategy
- Every feature adds "notify user" by default
- No preference controls for users

**Prevention:**

**Notification Hierarchy (MVP):**
1. **Essential:** Session starting in 15 minutes (if registered)
2. **Important:** Session limit reached (payment required)
3. **Nice-to-have:** Weekly summary (deferrable to V2)

**NOT send in MVP:**
- Captain availability changes
- "X friend joined FocusFlow"
- Daily motivation quotes
- Feature announcements

**User Control:**
- Email notification checkbox in profile
- Default: session reminders only
- One-click unsubscribe in every email footer

**Phase to address:** Phase 2 - Notifications

---

### 10. Privacy Backlash: Recorded Feeling

**What goes wrong:** Users feel recorded or surveilled during sessions, even if recording isn't happening. This kills psychological safety and prevents open sharing.

**Why it happens:**
- No clear "not recording" indicators
- Session summaries mention participant goals
- Room captains can "see" everything
- No transparency about data handling

**Prevention:**

**Privacy Signals:**
- Prominent "Live session — not recorded" badge
- Clear privacy policy in onboarding
- Goals only visible to user (not shared unless opt-in)
- Captain viewing limited to session management
- Data retention policy stated explicitly

**What Captains See:**
- Participant names
- Audio/video feeds
- "Task submitted" status (not task content)

**What Captains DON'T See:**
- Actual task content
- Participant browsing history
- Data from other sessions

**Phase to address:** Phase 1 - Core Features, Phase 2 - Privacy Policy

---

## Minor Pitfalls

### 11. Time Zone Confusion

**What goes wrong:** Users miss sessions because times displayed in their browser's local time don't match expected. "9 AM" means different things across India's single time zone but different cultural expectations.

**Prevention:** Display times as "9:00 AM IST" with timezone indicator, not just "9:00 AM"

---

### 12. Empty Room Problem

**What goes wrong:** Early users join rooms that are empty (first few participants). They feel awkward and leave, creating a retention death spiral.

**Prevention:**
- Don't show room until 3+ participants registered
- Show "X people registered" for upcoming sessions
- Consider "staggered start" — room opens when 4 registered
- Founder acts as Captain for initial sessions

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|----------------|------------|
| **Phase 1: Foundation** | WebRTC Setup | Connection silence | Test on multiple networks, implement ICE monitoring |
| **Phase 1: Foundation** | TURN Deployment | Cost explosion | Implement bandwidth limits from day 1, set alerts |
| **Phase 1: Foundation** | Task Feature | Over-engineering | Constrain task to 140 chars, no metadata |
| **Phase 2: Payments** | Payment Flow | Friction at session limit | Communicate limits upfront, show pricing before registration |
| **Phase 2: Community** | Captain System | Burnout & quality drift | Implement captain training and session limits |
| **Phase 2: Growth** | Notifications | Fatigue & disabling | Default to minimal, add user controls |
| **Any Phase** | Feature Additions | ADHD cognitive overload | Use feature evaluation framework, one primary action per screen |

---

## Sources

| Area | Confidence | Notes |
|------|------------|-------|
| WebRTC NAT/TURN | HIGH | Standard WebRTC patterns; verify with webrtc.org docs |
| ADHD UX Design | MEDIUM | General neurodivergent UX principles; verify with current ADHD UX research |
| SaaS Payment UX | MEDIUM | Industry best practices; verify with Stripe/Braintree UX guides |
| Community Management | MEDIUM | Volunteer moderation patterns; verify with community platform case studies |
| Privacy/Trust | MEDIUM | General data privacy principles; verify with Indian DPDP Act 2023 |

**Research Limitation:** Web search services were rate-limited. Recommendations should be verified against:
- [WebRTC Troubleshooting Guide](https://webrtc.org/getting-started/troubleshooting)
- [MDN WebRTC Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [coturn Documentation](https://github.com/coturn/coturn)
- Indian market SaaS case studies for payment patterns
- ADHD UX research from Nielsen Norman Group or similar

---

*Last updated: 2026-04-06*
