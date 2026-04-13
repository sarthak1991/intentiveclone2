# Phase 1: Foundation & Authentication - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-06
**Phase:** 1 - Foundation & Authentication
**Areas discussed:** UI component approach, authentication patterns, database schema design, onboarding experience, session management, error handling, timezone detection, welcome tour, magic link expiry

---

## UI Component Library

| Option | Description | Selected |
|--------|-------------|----------|
| shadcn/ui | Modern, accessible components built on Radix UI + Tailwind. Copy-paste components (full ownership), not a npm dependency. Beautiful default styling with great customization. | ✓ |
| Chakra UI | Complete component library as npm dependency. Dark mode built-in, excellent accessibility docs. More opinionated design system than shadcn/ui. | |

**User's choice:** shadcn/ui
**User notes:** "Use SdhaCN or ChakraUI. Whiever gives more elegant UI."

---

## Authentication Signup Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Credential provider + Google OAuth | Standard NextAuth.js setup. Users can choose email/password OR Google. Separates concerns, clearer UX, easier to add more OAuth providers later. | |
| Magic link primary + OAuth optional | Passwordless-first UX (simpler for users). Email magic link as primary, Google OAuth as alternative. No passwords to manage or reset. | ✓ |
| Email/password only + add OAuth later | Simplest MVP. Just email/password signup now, add Google OAuth in Phase 6 when we add payments. Reduces initial complexity. | |

**User's choice:** Magic link primary + OAuth optional
**Notes:** This balances user's preference for passwordless auth with requirements (AUTH-02 requires Google OAuth). Decision supports magic link UX while maintaining OAuth capability.

---

## Session Management

| Option | Description | Selected |
|--------|-------------|----------|
| Session cookies (recommended) | NextAuth default. httpOnly cookies prevent XSS. Sessions stored in database (more secure, can revoke). Standard for Next.js apps. | |
| JWT tokens (stateless) | Tokens stored client-side, sent with each request. More scalable horizontally, but harder to revoke and larger token size. | |
| Hybrid (short-lived JWT + refresh tokens) | Best of both but more complex. Short access token (15 min) + longer refresh token (7 days). Requires refresh token endpoint. | ✓ |

**User's choice:** Hybrid (short-lived JWT + refresh tokens)

---

## Password Requirements

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (8+ chars) | Easiest for users. Just length requirement. Modern approach — NIST guidelines say complexity rules don't help security much. | |
| Moderate (8+ chars, mixed case) | Middle ground. Length + uppercase/lowercase. Common pattern users understand. | ✓ |
| N/A - magic links only | If going magic-link primary, might not need passwords at all. Google OAuth backup means no password requirements. | |

**User's choice:** Moderate (8+ chars, mixed case)
**Notes:** Since magic links are primary, password requirements apply only to users who choose email/password fallback option.

---

## MongoDB Deployment Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| MongoDB Atlas (managed) | Recommended for MVP. Fully managed, automatic backups, global CDN. M10+ tier ($57/mo) for production. Free tier (M0) for development. | |
| Self-hosted on app VPS | Cost savings (no separate Atlas fee). Runs on same DigitalOcean VPS as app. You handle backups and monitoring. More setup work. | |
| Local development + self-hosted production | MongoDB locally for dev (fast, free), self-hosted on VPS for production. Cheapest option but no managed backups. | |

**User's choice:** Other (free-text response)
**User notes:** "Mongodb deployed on local docker container for testing. Will deploy on a managed service or docker for MVP prod"
**Interpretation:** Hybrid approach — Docker for local dev, flexible choice for production (managed service or Docker depending on cost/ops preference at deployment time).

---

## Onboarding Flow Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Multi-step wizard (recommended) | Break into 3-4 steps: (1) Name/photo (2) Timezone (3) Interests (4) Tour. Less overwhelming, better completion rates. | ✓ |
| Single form page | All fields on one page with clear sections. Simpler implementation, but can feel like more work upfront. | |
| Progressive capture | Minimal signup (just name/photo), capture timezone/interests later via gentle prompts. Lowest friction, but interests important for room matching. | |

**User's choice:** Multi-step wizard

---

## Session Duration

| Option | Description | Selected |
|--------|-------------|----------|
| 1 week (recommended) | Standard for web apps. Balances convenience (stay logged in) with security (reasonably fresh). Most users stay logged in. | |
| 30 days | More convenient, less frequent logins. Better for daily users (your target audience). Security trade-off. | |
| Configurable by user | "Remember me" checkbox. 1 week default, 30 days if checked. Gives users control. Adds complexity. | ✓ |

**User's choice:** Configurable by user

---

## Profile Photo Storage

| Option | Description | Selected |
|--------|-------------|----------|
| Direct upload to MongoDB GridFS | Store photos as binary in database. Simple for MVP, no separate storage service. Can migrate to S3 later if needed. | ✓ |
| Cloudinary / Cloud storage | Separate CDN service. Better for performance and scaling. Adds dependency and cost (though Cloudinary has free tier). | |
| Gravatar only (no upload) | Simplest MVP. Users enter email, we pull Gravatar if exists, otherwise default avatar. No upload handling needed. | |

**User's choice:** Direct upload to MongoDB GridFS

---

## Error Message Style

| Option | Description | Selected |
|--------|-------------|----------|
| Gentle, helpful messages | "That email doesn't look quite right" vs "Invalid email". Contextual hints ("Check your caps lock"). Warmer UX, more implementation work. | ✓ |
| Direct, clear messages | Standard error messages ("Invalid email or password"). Users understand what went wrong. Faster to implement. | |
| Minimal + inline help | Very brief errors ("Email required") with persistent helper text under fields. Cleanest UI, requires good form design. | |

**User's choice:** Gentle, helpful messages
**User notes:** Aligns with ADHD-friendly UX philosophy stated in requirements (gentle nudges, not alarms).

---

## Timezone Detection

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-detect from browser | Use Intl.DateTimeFormat().resolvedOptions().timeZone. Works in modern browsers. Show detected timezone + manual dropdown override. | ✓ |
| Ask user to select | Dropdown list of major timezones. No auto-detection. Simpler but requires user input (friction). | |
| IP geolocation + manual override | Use geolocation service (free tier) to guess timezone. More accurate for travelers. Adds external dependency. | |

**User's choice:** Auto-detect from browser

---

## Welcome Tour Style

| Option | Description | Selected |
|--------|-------------|----------|
| Interactive walkthrough (recommended) | Step-by-step tour highlighting key areas. "This is your room schedule" → "Click here to join". Engaging, but adds dev time. | |
| Video tutorial | Embed 60-second explainer video. Less engineering work, but users might skip it (you can't make video interactive easily). | |
| Skip tour (come back later) | No forced tour. Add "How it works" help section accessible anytime. Fastest to implement, users can explore freely. | ✓ |

**User's choice:** Skip tour (come back later)

---

## Magic Link Expiry Time

| Option | Description | Selected |
|--------|-------------|----------|
| 15-minute expiry | Standard security window. Long enough to check email, short enough to prevent misuse if account compromised. | ✓ |
| 1 hour expiry | More user-friendly (busy people might not check email immediately). Slightly higher security risk but acceptable for MVP. | |
| 24 hours (single-use) | Most convenient. User can use whenever they check email. Still single-use (link expires after first click). | |
| You decide (Claude's discretion) | Pick industry standard based on security best practices for magic links. | |

**User's choice:** 15-minute expiry

---

## Claude's Discretion Areas

User deferred these decisions to Claude's judgment:
- Token storage strategy (httpOnly cookies vs. localStorage)
- Session refresh mechanism (silent vs. user-triggered)
- Photo upload UX design (drag-drop, button, preview, cropping)
- Interest tag selection format (checkboxes, chips, multi-select)
- Error message tone calibration (helpful without being condescending)

## Deferred Ideas

### Payment-First Magic Link Authentication
**User's original vision:** Email captured at payment → successful payment → redirect home → enter email → check payment in database → if paid, send magic link → if unpaid, redirect to payment with email pre-filled.

**Why deferred:** Current requirements (AUTH-01 through AUTH-05) specify traditional signup flows. This idea changes user acquisition flow from "signup then pay" to "pay then signup" — a business model decision for Phase 6 or V2.

**Noted for:** Phase 6 (Payments & Notifications) integration or V2 funnel testing.

---

## Scope Discussion

**Important note:** During initial question about auth approach, user described payment-first magic link flow that conflicted with Phase 1 requirements. User chose **Option A: Stick with current requirements** (email/password + Google OAuth in Phase 1, payments in Phase 6) rather than updating requirements to match payment-first vision.

**Decision captured:** Phase 1 will implement AUTH-01 through AUTH-05 as specified. Payment-first magic link flow noted as deferred idea for future consideration.

---
