# Technology Stack

**Project:** FocusFlow - ADHD Focus Rooms
**Researched:** 2026-04-06
**Overall Confidence:** HIGH

## Executive Summary

For a self-hosted video accountability platform with custom WebRTC implementation, the recommended stack combines Next.js 16 for the frontend, Node.js 22 LTS for the backend, MongoDB for data persistence, and mediasoup as the WebRTC SFU. This stack prioritizes data sovereignty, cost efficiency through self-hosting, and real-time performance required for 12-person video rooms.

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Next.js** | 16.2.2 | React framework for frontend | App Router with Server Components, excellent DX, built-in API routes, React 19 support. Confirmed from [official docs](https://nextjs.org/docs) showing latest version 16.2.2. |
| **React** | 19 (built-in) | UI library | Bundled with Next.js 16 App Router. Includes concurrent features and Server Components. |
| **TypeScript** | 5.x | Type safety | Industry standard for 2025. Catches bugs at compile time, excellent IDE support. |
| **Tailwind CSS** | 3.4+ | Styling | Recommended in Next.js docs. Zero runtime, utility-first, excellent for rapid UI development. |

**Confidence:** HIGH - Verified from official Next.js documentation (2026-04-06)

### Backend Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **Node.js** | 22.x (LTS) | Backend runtime | Current LTS as of April 2026. Latest version confirmed: 25.9.0. Use LTS (22.x) for production stability. |
| **Next.js API Routes** | Built-in | REST/Server Actions | Eliminates need for separate Express server. Server Actions in App Router handle mutations. |
| **mediasoup** | 3.19.19 | WebRTC SFU | Production-grade Selective Forwarding Unit. C++ core with Node.js wrapper. Handles 12+ concurrent video streams efficiently. |

**Confidence:** HIGH - Node.js version verified via npm (2026-04-06)

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **MongoDB** | 7.0+ | Primary database | Flexible schema for user profiles, sessions, rooms. Document model fits hierarchical data (rooms -> participants -> tasks). |
| **Mongoose** | 8.x | ODM for MongoDB | Alternative to Prisma for MongoDB. Better native MongoDB support, mature ecosystem. |
| **Prisma** | 7.6.0 | ORM (if using PostgreSQL) | If switching to PostgreSQL for relational needs. Verified version: 7.6.0, Prisma Client: 7.6.0. |

**Why MongoDB over Prisma + PostgreSQL:**
- Prisma's MongoDB support has historically been less mature than PostgreSQL
- Document model naturally fits room-based data structures
- Easier to evolve schema during MVP validation
- Native JSON support for flexible user preferences

**Confidence:** MEDIUM - MongoDB version from official docs, Prisma versions verified via npm

---

## WebRTC Implementation

### Video Conferencing Stack

| Component | Technology | Version | Purpose | Why |
|-----------|-----------|---------|---------|-----|
| **SFU** | mediasoup | 3.19.19 | Selective Forwarding Unit | Handles P2P routing for 12-person rooms. C++ core for performance. Active development, proven at scale. |
| **Signaling** | Socket.IO | 4.8.3 | WebRTC signaling server | Manages room state, peer discovery. Server/client versions: 4.8.3/4.8.3. Automatic reconnection, room namespaces. |
| **STUN/TURN** | coturn | Latest | NAT traversal | Required for connections behind firewalls. Self-hosted on separate VPS per project constraints. |
| **Client SDK** | mediasoup-client | 3.19.19 | Browser WebRTC | Matches server version. Handles getUserMedia, RTCPeerConnection abstraction. |

### WebRTC Architecture

```
[Browser 1-12] <--WebRTC--> [mediasoup SFU] <--WebRTC--> [Browser 1-12]
                             ↓
                        [Socket.IO] <--Signaling--> [Browser]
                             ↓
                        [Node.js Backend] <--REST--> [Next.js API Routes]
                             ↓
                        [MongoDB] (room state, user data)
```

### Why mediasoup over alternatives:

| Alternative | Why Not for FocusFlow |
|-------------|----------------------|
| **Twilio/Daily.co** | Violates data sovereignty requirement. Recurring costs at scale. |
| **Jitsi Meet** | Too heavy for MVP. Full platform when we only need video component. Harder to customize. |
| **LiveKit** | Excellent modern stack, but mediasoup has longer Node.js pedigree. LiveKit pushes Go. |
| **Simple-peer** | P2P only. Doesn't scale to 12-person rooms (mesh topology = 66 connections). |
| **Janus Gateway** | C-based, steeper learning curve. Plugin architecture overkill for MVP. |

**Confidence:** HIGH - mediasoup and Socket.IO versions verified via npm

### STUN/TURN Setup

| Component | Technology | Purpose | Deployment |
|-----------|-----------|---------|------------|
| **STUN** | Google's public STUN (stun:stun.l.google.com:19302) | Free, works for most P2P connections | Use initially |
| **TURN** | coturn | Relay for restrictive NAT/firewalls | Separate VPS, mandatory for production |

**Why coturn:**
- Industry standard, battle-tested
- Supports TLS for secure TURN
- REST API for dynamic credential generation
- Low resource footprint

**TURN Server Requirements:**
- Minimum: 1 vCPU, 1GB RAM (DigitalOcean $6/mo)
- Recommended: 2 vCPU, 2GB RAM for 100+ concurrent users
- Bandwidth: 500 Mbps per 50 concurrent video users (estimate)

---

## Real-time Communication

| Technology | Version | Purpose | When to Use |
|-------------|---------|---------|-------------|
| **Socket.IO** | 4.8.3 | Room signaling, chat, presence | For all WebRTC signaling and in-session chat |
| **Server-Sent Events** | Built-in | One-way updates (session reminders) | For notifications where client->server not needed |
| **Polling** | - | Session status checks | Fallback only, avoid for real-time features |

**Socket.IO Rooms Configuration:**
- Namespace: `/` (default)
- Rooms: `session-{sessionId}` for each focus room
- Events: `join`, `leave`, `signal`, `chat-message`, `mute`, `toggle-audio`

**Confidence:** HIGH - Socket.IO version verified via npm

---

## Payment Integration (Indian Market)

### Primary Provider

| Technology | Purpose | Why |
|------------|---------|-----|
| **Razorpay** | Payment gateway | Market leader in India. Excellent UPI support, QR codes, netbanking. Good documentation. |

### Razorpay Integration

| Feature | Implementation |
|---------|----------------|
| **UPI QR** | Razorpay Payment Page with `method: upi`, `flow: collect` |
| **Netbanking** | Built-in to Razorpay, all major banks supported |
| **Subscriptions** | Razorpay Subscriptions API for weekly/monthly plans |
| **Webhooks** | `payment.captured`, `subscription.cancelled` for status updates |

### Alternative

| Provider | When to Consider |
|----------|------------------|
| **Cashfree** | If Razorpay onboarding fails. Similar features, growing market share. |
| **Stripe** | NOT recommended for India-focused MVP. UPI support limited, higher fees. |

### Payment Flow

```
[User] -> [Checkout Page] -> [Razorpay SDK] -> [UPI App/Netbanking]
                                          ↓
                                  [Razorpay Webhook] -> [Next.js API] -> [MongoDB]
                                          ↓
                                  [Update subscription status, session limits]
```

**Confidence:** MEDIUM - Based on market knowledge, official docs not accessible due to API limits

---

## Authentication & Security

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| **NextAuth.js** | 5.x (beta) / 4.x stable | Authentication | Works with Next.js App Router. Supports credentials, OAuth, email magic links. |
| **bcrypt** | 5.x | Password hashing | Industry standard for password hashing. |
| **jsonwebtoken** | 9.x | JWT tokens | For API authentication if needed beyond sessions. |
| **zod** | 3.x | Input validation | Runtime type validation. Use with Server Actions. |

**Why NextAuth.js:**
- Built for Next.js, handles session management
- Supports credentials (email/password) for MVP
- Easy to add Google OAuth later
- CSRF protection built-in

---

## Infrastructure

### Deployment Architecture

```
[DigitalOcean VPS 1] - Application Server
  - Next.js (standalone build)
  - Node.js 22.x
  - MongoDB (or managed Atlas)
  - nginx reverse proxy

[DigitalOcean VPS 2] - TURN Server
  - coturn
  - Static IP required
  - Open ports: 3478 (TURN), 5349 (TURNS), 49152-65535 (UDP relay)

[Optional] - Managed Services
  - MongoDB Atlas (if not self-hosting DB)
  - Redis (for session caching, Socket.IO adapter - scale to multiple app servers)
```

### VPS Requirements

| Component | Minimum | Recommended | Cost (approx) |
|-----------|---------|-------------|---------------|
| **App Server** | 2 vCPU, 4GB RAM | 4 vCPU, 8GB RAM | $24-48/mo |
| **TURN Server** | 1 vCPU, 1GB RAM | 2 vCPU, 2GB RAM | $6-12/mo |
| **MongoDB** | - | Managed Atlas M10 | $57/mo OR self-host on app server |

### Why DigitalOcean:
- Cost-effective for personal projects
- Simple UI, good documentation
- Data centers in India (Mumbai/Bangalore) - low latency for target market
- Fixed pricing, predictable bills

**Confidence:** HIGH - Based on project constraints and standard deployment patterns

---

## Supporting Libraries

### Frontend

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@radix-ui/react-*** | Latest | Accessible UI primitives | For modals, dialogs, dropdowns. Unstyled, accessible. |
| **react-hook-form** | 7.x | Form management | For onboarding, checkout, profile forms. |
| **zustand** | 4.x | State management | For room state, participant lists. Lightweight vs Redux. |
| **canvas-confetti** | 1.x | Celebration effects | For task completion celebration. |
| **date-fns** | 3.x | Date utilities | For session scheduling, countdowns. |

### Backend

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **nodemailer** | 6.x | Email sending | For session reminders, no-show alerts. Use with Gmail SES or SendGrid. |
| **node-cron** | 3.x | Scheduled tasks | For session creation (8 daily rooms), reminder jobs. |
| **bull** | 4.x | Job queue | For email jobs, session cleanup if Redis is added. |

### DevOps

| Tool | Purpose | Why |
|------|---------|-----|
| **PM2** | Process manager | Keep Next.js and Node.js processes alive. Auto-restart on failure. |
| **nginx** | Reverse proxy | SSL termination, static file serving, load balancing. |
| **certbot** | Let's Encrypt | Free SSL certificates. |

---

## Installation

### Core Dependencies

```bash
# Frontend & Framework
npm install next@16.2.2 react@19 react-dom@19 typescript@5 tailwindcss@3

# Backend (if separate)
npm install express@4 # Only if separate server needed
npm install mediasoup@3.19.19
npm install socket.io@4.8.3

# Database
npm install mongoose@8
# OR if using Prisma + PostgreSQL
npm install prisma@7.6.0 @prisma/client@7.6.0

# Authentication
npm install next-auth@5 bcryptjs jsonwebtoken

# Validation
npm install zod

# Email
npm install nodemailer

# Dev dependencies
npm install -D @types/node @types/react @types/bcryptjs @types/nodemailer
npm install -D eslint eslint-config-next
npm install -D prettier prettier-plugin-tailwindcss
```

### WebRTC Dependencies

```bash
# mediasoup (server)
npm install mediasoup@3.19.19

# mediasoup client (browser)
npm install mediasoup-client@3.19.19

# Signaling
npm install socket.io@4.8.3 socket.io-client@4.8.3
```

---

## What NOT to Use (Anti-Stack)

| Category | Avoid | Why | Alternative |
|----------|-------|-----|-------------|
| **WebRTC Services** | Twilio Video, Daily.co, Agora | Violates data sovereignty, recurring costs scale with users | mediasoup self-hosted |
| **Frontend Framework** | Vue, Angular, Svelte | Team chose Next.js, less ecosystem for WebRTC integrations | Next.js 16 |
| **State Management** | Redux, MobX | Overkill for room state. Boilerplate-heavy. | zustand or React Context |
| **Styling** | CSS-in-JS (styled-components, emotion) | Runtime cost, SSR complexity | Tailwind CSS |
| **Database** | PostgreSQL for MVP | Prisma's MongoDB support maturing, but mongoose more proven | MongoDB + Mongoose |
| **Authentication** | Passport.js | Too much setup, NextAuth better for Next.js | NextAuth.js |
| **Real-time** | raw WebSocket | No reconnection, no rooms, more code | Socket.IO |
| **Payment** | Stripe (for India MVP) | Poor UPI support, higher transaction fees | Razorpay |
| **Deployment** | Vercel, Netlify | Can't host custom WebRTC SFU, limits background jobs | DigitalOcean VPS |
| **WebRTC P2P** | simple-peer for multi-person | Mesh topology doesn't scale past 4-5 users | mediasoup SFU |

---

## Phase 1 (MVP) vs Phase 2+ Stack

### Phase 1: Core Validation
- All of above stack
- Single app server (no Redis)
- Self-hosted MongoDB on app server
- Manual room creation (no auto-scaling)

### Phase 2: Scale & Reliability
- Add Redis for Socket.IO adapter (multiple app servers)
- MongoDB Atlas for managed database
- Auto-scaling rooms when 12 participants reached
- Add monitoring (Sentry for errors, Posthog for analytics)

### Phase 3: Mobile
- React Native with Expo
- Reuse mediasoup-client (React Native compatible)
- Native WebRTC support

---

## Migration Path

If validating PostgreSQL over MongoDB:

```bash
# Replace Mongoose with Prisma + PostgreSQL
npm uninstall mongoose
npm install prisma@7.6.0 @prisma/client@7.6.0 pg

# Update schema.prisma
# Generate client
npx prisma generate
```

---

## Sources

| Source | Confidence | Notes |
|--------|------------|-------|
| [Next.js Official Documentation](https://nextjs.org/docs) | HIGH | Confirmed version 16.2.2, App Router with React 19 |
| [Node.js npm registry](https://www.npmjs.com/package/node) | HIGH | Confirmed latest version 25.9.0, LTS 22.x recommended |
| [mediasoup npm](https://www.npmjs.com/package/mediasoup) | HIGH | Confirmed version 3.19.19 |
| [Socket.IO npm](https://www.npmjs.com/package/socket.io) | HIGH | Confirmed version 4.8.3 |
| [Prisma Documentation](https://www.prisma.io/docs) | HIGH | Confirmed version 7.6.0 for ORM and client |
| [MongoDB Installation Docs](https://www.mongodb.com/docs/manual/installation) | HIGH | Confirmed version 7.0+ available, 6.0 EOL noted |
| [WebRTC Overview](https://webrtc.org/getting-started/overview) | HIGH | WebRTC API fundamentals verified |
| [Razorpay Documentation](https://razorpay.com/docs) | MEDIUM | Not accessed due to API limits, based on market knowledge |
| [mediasoup.org](https://mediasoup.org) | MEDIUM | Not accessed due to API limits, verified via npm |
| [coturn GitHub](https://github.com/coturn/coturn) | MEDIUM | Not accessed due to API limits, industry standard |

---

## Confidence Assessment

| Area | Level | Reason |
|------|-------|--------|
| Core Framework (Next.js) | HIGH | Official docs verified, version confirmed via npm |
| Backend (Node.js) | HIGH | Version confirmed via npm, LTS track known |
| Database (MongoDB) | MEDIUM | Docs accessed, version known, Prisma/MongoDB tradeoff based on ecosystem knowledge |
| WebRTC (mediasoup) | HIGH | Version confirmed via npm, architecture well-understood |
| Real-time (Socket.IO) | HIGH | Version confirmed via npm, standard choice for signaling |
| Payments (Razorpay) | MEDIUM | Market leader status known, docs not accessed due to API limits |
| Infrastructure (DigitalOcean) | HIGH | Standard deployment pattern, project constraints explicit |

---

*Last updated: 2026-04-06*
*Next review: After MVP phase, before Phase 2 scaling decisions*
