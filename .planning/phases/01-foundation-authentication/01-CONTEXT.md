# Phase 1: Foundation & Authentication - Context

**Gathered:** 2026-04-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Setting up the technical foundation for FocusFlow including Next.js 16.2.2 project initialization, MongoDB database schema design, and implementing user authentication with onboarding flows. This phase delivers the core user account system that all subsequent features depend on.

**What this includes:**
- Next.js 16.2.2 project setup with App Router and TypeScript
- MongoDB 7.0+ database connection with Mongoose 8.x ORM
- User authentication (magic link primary + Google OAuth optional)
- Passwordless login flow with 15-minute magic link expiry
- Multi-step onboarding (name, photo, timezone, interests)
- Session management with hybrid JWT approach
- Profile photo storage via MongoDB GridFS

**What this does NOT include:**
- Payment processing (Phase 6)
- Room management (Phase 2)
- Real-time features (Phase 3)
- Video/WebRTC (Phase 4)
</domain>

<decisions>
## Implementation Decisions

### UI Components & Design System
- **D-01:** Use **shadcn/ui** for UI component library — modern, accessible components built on Radix UI + Tailwind CSS, copy-paste model gives full ownership without npm dependency bloat

### Authentication Strategy
- **D-02:** Implement **magic link authentication as primary** method with email-based passwordless login
- **D-03:** Support **Google OAuth as optional alternative** to magic links (reduces signup friction per AUTH-02 requirement)
- **D-04:** Support **email/password as fallback method** for users who prefer traditional credentials (per AUTH-01 requirement)
- **D-05:** Magic links **expire after 15 minutes** for security balance (user convenience vs. risk window)
- **D-06:** Implement **"Remember me" checkbox** for configurable session duration (1 week default, 30 days when checked)
- **D-07:** Use **gentle, helpful error messages** throughout auth flows (e.g., "That email doesn't look quite right" vs "Invalid email") aligned with ADHD-friendly UX philosophy

### Session Management
- **D-08:** Implement **hybrid JWT token approach** with short-lived access tokens (15 minutes) + longer-lived refresh tokens (7 days) for optimal security/performance balance
- **D-09:** Support **cross-browser session persistence** via secure httpOnly cookies (prevents XSS attacks)

### Database & Storage
- **D-10:** Use **local Docker container** for MongoDB during development/testing (fast, free, isolated)
- **D-11:** Use **managed MongoDB service (Atlas M10+) or Docker deployment** for production MVP (team will decide based on cost vs. ops preference)
- **D-12:** Store **user profile photos in MongoDB GridFS** for MVP simplicity (single database, no separate CDN dependency, can migrate to S3 later if needed)

### User Onboarding
- **D-13:** Implement **multi-step onboarding wizard** broken into 3-4 focused steps to reduce overwhelm:
  - Step 1: Name & profile photo
  - Step 2: Timezone (auto-detected with manual override)
  - Step 3: Interest selection (pre-defined tags for occupation, goals, expertise level)
  - Step 4: Completion/welcome
- **D-14:** **Auto-detect user timezone** from browser using `Intl.DateTimeFormat().resolvedOptions().timeZone` with manual dropdown override option
- **D-15:** **Skip forced welcome tour** — add accessible "How it works" help section instead (users can explore freely, reduces onboarding friction)

### Password Policy (for email/password fallback)
- **D-16:** Enforce **moderate password requirements**: minimum 8 characters with mixed case (uppercase + lowercase)

### Claude's Discretion
- **Token storage strategy**: Choose between httpOnly cookies vs. localStorage based on NextAuth.js best practices and security requirements
- **Session refresh mechanism**: Implement silent token refresh or user-triggered re-auth based on hybrid JWT pattern research
- **Photo upload UX**: Design upload interface (drag-drop vs. button, preview, cropping) based on shadcn/ui component patterns
- **Interest tag selection**: Choose tag display format (checkboxes, chips, multi-select) based on what works best with shadcn/ui components
- **Error message tone**: Calibrate "gentle" messages to be helpful without being condescending (test with real users during MVP)

### Deferred Ideas
- **Payment-first magic link flow**: User's original vision where email is captured at payment, then magic link grants site access only after successful payment verification. Deferred to Phase 6 (Payments) or V2 as it fundamentally changes user journey from current requirements (AUTH-01 through AUTH-05 specify traditional signup flows).
- **Email-only auth (no passwords)**: Consider removing email/password fallback entirely after MVP validation if magic links + Google OAuth prove sufficient for user needs.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Requirements
- `.planning/REQUIREMENTS.md` — Complete v1 requirements list with AUTH-01 through AUTH-05, ONBD-01 through ONBD-04, TECH-01 through TECH-03
- `.planning/ROADMAP.md` — Phase 1 scope, success criteria, and phase dependencies
- `.planning/PROJECT.md` — Core value proposition, constraints, and technical stack decisions

### Technical Stack Documentation
- `.claude/CLAUDE.md` — Technology stack section with Next.js 16.2.2, Node.js 22.x, MongoDB 7.0+, Mongoose 8.x specifications
- CLAUDE.md constraints section — Budget constraints (DigitalOcean VPS), data sovereignty requirements (custom WebRTC), geography (Indian market, UPI payments)

### Onboarding Requirements
- REQUIREMENTS.md §Onboarding & Profile (ONBD-01 through ONBD-04) — Minimal profile setup, interest tags from pre-defined selection, welcome tour under 60 seconds skippable
- REQUIREMENTS.md §Out of Scope — Note: "Flexible/anytime room creation" excluded to prevent choice paralysis, "Long-form session notes/journals" excluded due to friction

### Authentication Requirements
- REQUIREMENTS.md §Authentication (AUTH-01 through AUTH-05) — Email/password signup, Google OAuth, password reset via email link
- REQUIREMENTS.md §Out of Scope — "Freemium with aggressive upsell" excluded (gentle upgrade prompt only), "Third-party video services" excluded (data sovereignty)

### Technical Infrastructure Requirements
- REQUIREMENTS.md §Technical Infrastructure (TECH-01 through TECH-03) — Next.js 16.2.2 frontend, Node.js 22.x backend, MongoDB 7.0+ with Mongoose 8.x ORM
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
**None yet** — This is Phase 1, the foundational phase. No existing codebase to reuse. All code created in this phase establishes patterns for subsequent phases.

### Established Patterns
**None yet** — This phase establishes:
- State management pattern (will inform room state in Phase 2)
- Authentication flow pattern (will inform all protected routes)
- Database schema pattern (will inform all Mongoose models)
- Error handling pattern (will inform all user-facing error messages)
- Component organization pattern (will inform all UI development)

### Integration Points
**Future integration points** — Code created in this phase will connect to:
- Phase 2 (Room Management): User profiles linked to room registrations
- Phase 3 (Real-Time Infrastructure): Authenticated WebSocket connections
- Phase 6 (Payments): User subscription tier and payment history
</code_context>

<specifics>
## Specific Ideas

### Authentication Flow Mental Model
User described original vision (deferred to Phase 6/V2): "When user goes to make payment, that's when we take their email. If payment is successful, user is redirected to home page where they can enter email to login. We check if email has successful payment in database. If yes, we send magic link to click and get access. If no payment against email, redirect to payment page with email pre-filled."

This payment-first auth flow is noted as deferred but provides context for eventual Phase 6 integration.

### UI Elegance Priority
User emphasized "Use shadcn/ui or Chakra UI. Whichever gives more elegant UI" — decision landed on shadcn/ui for modern, accessible design with full component ownership.

### Error Message Tone
User wants "gentle, helpful messages" throughout — this reflects ADHD-friendly UX philosophy stated in requirements (gentle nudges, not alarms). Example: "That email doesn't look quite right" instead of "Invalid email format."

### Multi-Step Onboarding Rationale
Multi-step wizard chosen to "reduce overwhelm" — directly addresses ADHD user need to avoid cognitive overload during signup. Each step should feel quick and focused.

### Database Deployment Flexibility
User specified "MongoDB deployed on local docker container for testing. Will deploy on a managed service or docker for MVP prod" — maintains flexibility to choose based on cost vs. operational preference when reaching production.

### No External Spec References
User did not reference any external specifications, ADRs, or technical documents during discussion. All decisions based on requirements, project constraints, and user preferences expressed in conversation.
</specifics>

<deferred>
## Deferred Ideas

### Payment-First Magic Link Authentication
**Original vision from user:** Email captured at payment time → successful payment → redirect to home → enter email → check for payment in database → if paid, send magic link → if unpaid, redirect to payment with email pre-filled.

**Why deferred:** Current requirements (AUTH-01 through AUTH-05) specify traditional signup flows (email/password + Google OAuth) that must be implemented in Phase 1. Payments are Phase 6 scope. This idea fundamentally changes the user acquisition flow from "signup then pay" to "pay then signup" — a business model decision that should be made deliberately, not assumed during technical foundation phase.

**Where it belongs:** Phase 6 (Payments & Notifications) when implementing payment integration, or V2 if MVP validates current approach. Could be tested as an alternate funnel in V2 without changing Phase 1 foundation.

**Implementation note:** Phase 1 should build auth system flexible enough to support this flow later — magic link capability already planned, payment verification hook would be added in Phase 6.

### Email-Only Authentication (No Password Fallback)
**Idea:** Remove email/password signup entirely after MVP, keep only magic links + Google OAuth.

**Why deferred:** Current requirements explicitly include AUTH-01 (email/password signup). Need MVP data to determine if users prefer passwordless vs. traditional credentials.

**Where it belongs:** V2 decision based on MVP user behavior and security audit.

### None — Discussion Stayed Within Phase Scope
All other discussion items clarified implementation of Phase 1 scoped work (authentication, onboarding, technical foundation) without adding new capabilities outside Phase 1 boundary.
</deferred>

---

*Phase: 01-foundation-authentication*
*Context gathered: 2026-04-06*
