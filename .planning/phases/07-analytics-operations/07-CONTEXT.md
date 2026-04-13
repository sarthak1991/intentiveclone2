# Phase 7: Analytics & Operations - Context

**Gathered:** 2026-04-08
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin analytics dashboard, bandwidth monitoring, and production readiness polish. This phase delivers visibility into system health, user behavior, and operational metrics.

**What this includes:**
- Admin analytics dashboard with sidebar navigation
- Attendance dashboard (session counts, attendance rates)
- Basic analytics (revenue, active users, no-shows, captain coverage)
- User management (ban/suspend with reason and duration)
- Bandwidth monitoring (daily totals, per-room breakdown, relay vs direct ratio, trends)
- Bandwidth alerts (quota % and cost threshold)
- Production readiness (comprehensive error handling and logging)

**What this does NOT include:**
- Payment processing (Phase 8)
- New user-facing features

</domain>

<decisions>
## Implementation Decisions

### Dashboard Layout
- **D-01:** Use **sidebar navigation** with separate pages for each category (Overview, Attendance, Users, Bandwidth). More scalable if adding more admin features later.
- **D-02:** Show **comprehensive metric grid** on overview page: sessions, attendance, users, revenue (when Phase 8 live), bandwidth, no-shows, captain coverage.
- **D-03:** Use **consistent card layout** across all dashboard pages (pattern from existing `/admin/rooms` page).

### Analytics Time Range
- **D-04:** Provide **presets + custom date picker + period comparison**: Today, Yesterday, Past 7 Days, Past 30 Days, Custom Range, and "Compare to previous period" toggle.
- **D-05:** Default to **Past 7 Days** on page load — provides meaningful trend context without overwhelming data volume.

### User Management
- **D-06:** Use **modal form** for ban/suspend actions — requires reason and duration. Builds audit trail, prevents accidental actions.
- **D-07:** Show **user list with search/filter**: Name, email, signup date, status, last seen, sessions attended, no-show rate, streak. Full admin control.
- **D-08:** Implement **search by email** and **filter by status** (active, suspended, banned) for user management efficiency.

### Bandwidth Monitoring
- **D-09:** Provide **full monitoring**: daily total GB, per-room breakdown, relay vs direct ratio, trends graph.
- **D-10:** Implement **dual alert system**: quota % (warning at 80%, critical at 90%) AND cost threshold (alert when daily estimated cost exceeds threshold).
- **D-11:** Display **estimated cost** alongside bandwidth usage — directly connects technical metric to business cost.

### Data Visualization
- **D-12:** Use **minimal charts** — line trends for time-series, simple bar charts for comparisons. Avoid visual overload (ADHD-friendly UX from prior phases).
- **D-13:** Show **trend direction** with small up/down arrows and percentage change. Quick visual indicator without complex charts.

### Error Handling & Logging (Production Readiness)
- **D-14:** Implement **comprehensive server logging** — structured JSON logs for all critical events (WebRTC connection failures, room errors, payment events).
- **D-15:** Use **different log levels** — debug, info, warn, error — with environment-based configuration (verbose in dev, minimal in production).
- **D-16:** Log **user actions** in admin panel (ban, suspend, room creation) for audit trail.

### Claude's Discretion
- **Chart library**: Choose lightweight charting library (recharts, chart.js) or build simple SVG components. Prioritize simplicity over feature richness.
- **Alert delivery**: Email alerts, in-app notifications, or both for bandwidth thresholds.
- **Data retention**: How long to keep aggregated analytics data (raw data in MongoDB, aggregated stats computed on-the-fly or cached).
- **Refresh interval**: Real-time (WebSocket) or periodic refresh for dashboard metrics.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Admin Panel — ADMN-02, ADMN-03, ADMN-05: Attendance dashboard, analytics, user management
- `.planning/REQUIREMENTS.md` §Technical Infrastructure — TECH-06: TURN bandwidth monitoring
- `.planning/ROADMAP.md` §Phase 7: Analytics & Operations — Phase goal, success criteria, and plan list (7 plans)

### Existing Code Patterns
- `src/app/admin/rooms/page.tsx` — Reference admin page with stat cards, use similar card layout
- `src/lib/admin.ts` — `requireAdmin` helper for auth, reuse for all admin pages
- `src/components/admin/` — Reusable admin components (RoomManagePanel, CaptainAssignment, etc.)
- `server/webrtc-server.ts` — Mediasoup worker, add bandwidth stats collection here

### Prior Phase Context
- `.planning/phases/01-foundation-authentication/01-CONTEXT.md` — User model (role field), session management
- `.planning/phases/04-webrtc-integration/04-CONTEXT.md` — WebRTC architecture, TURN server setup
- `.planning/phases/05-focus-session-features/05-CONTEXT.md` — Gamification stats (streaks, completion tracking)

### Component Library
- `src/components/ui/` — shadcn/ui components (Card, Button, Badge, Dialog, Select, Input) for dashboard

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Admin auth**: `src/lib/admin.ts` — `requireAdmin` helper for route protection
- **Admin pages**: `src/app/admin/rooms/page.tsx` — Template for stat cards layout
- **Admin components**: `src/components/admin/` — CaptainAssignment, CaptainRemarks, NoShowManager, etc.
- **shadcn/ui**: Card, Button, Badge, Dialog, Select, Input, Table components
- **WebRTC server**: `server/webrtc-server.ts` — Mediasoup worker, add bandwidth tracking hooks

### Established Patterns
- **Server-side rendering**: Admin pages use async server components, fetch data in RSCs
- **Stat card layout**: Three-column grid with white cards, bold numbers, gray labels (from admin/rooms)
- **Navigation**: Sidebar pattern exists in Navigation.tsx, extend for admin subsections

### Integration Points
- **User model**: Add `status` field (active, suspended, banned), `banReason`, `banExpiresAt`
- **Registration model**: Query for attendance stats, no-show rates
- **Room model**: Query for session counts, capacity utilization
- **WebRTC stats**: Add byte counters to mediasoup transports, aggregate periodically
- **Logging**: Integrate structured logging throughout server code

### New Database Collections Needed
- **AdminLog**: Track admin actions (userId, action, targetId, reason, timestamp)
- **BandwidthStats**: Daily aggregated bandwidth/cost tracking (date, bytesRelayed, bytesDirect, estimatedCost)

</code_context>

<specifics>
## Specific Ideas

### Sidebar Navigation
User chose sidebar navigation for scalability. Suggested structure:
- Overview (comprehensive metrics)
- Attendance (detailed session stats)
- Users (management with search/filter)
- Bandwidth (monitoring with alerts)
- Rooms (existing room management)

### Modal Form for Ban/Suspend
User chose modal with reason and duration. This creates audit trail and prevents accidental actions. Should include:
- Action type (ban or suspend)
- Duration (dropdown: 1 day, 1 week, 1 month, permanent)
- Reason (required text area)
- Confirmation button with warning styling

### Dual Alert System
User chose both quota % and cost threshold alerts. Provides both technical visibility (relay bandwidth limits) and business visibility (cost overruns). Example:
- Warning: 80% of TURN bandwidth quota used
- Critical: 90% of TURN bandwidth quota used
- Cost: Daily estimated cost exceeds $5.00

### Comprehensive Metrics Grid
User wanted full visibility on overview. Suggested cards:
- Total sessions (today, with trend)
- Attendance rate (today vs 7-day avg)
- Active users (today)
- Bandwidth used (today GB, cost estimate)
- No-show rate (today)
- Captain coverage (% sessions with captain)
- Revenue (if Phase 8 live)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 7 scope (analytics dashboard, user management, bandwidth monitoring, production readiness). No new capabilities or features outside Phase 7 boundary were introduced.

</deferred>

---

*Phase: 07-analytics-operations*
*Context gathered: 2026-04-08*
