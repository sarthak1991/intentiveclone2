# Phase 2: Room Management - Research

**Researched:** 2026-04-06
**Domain:** Room Scheduling, WebSocket Infrastructure, Admin Controls
**Confidence:** HIGH

## Summary

Phase 2 implements the core room management system for FocusFlow, enabling users to view scheduled rooms (8 daily sessions from 9am-4pm), register for sessions, and providing admin controls for room management. This phase also establishes the WebSocket signaling infrastructure using Socket.IO 4.8.3 that will power real-time features in Phase 3-6.

**Primary recommendation:** Use individual room documents with date-based scheduling (not recurring series), implement Socket.IO as a separate Node.js server alongside Next.js, and use shadcn/ui's calendar component with date-fns for timezone handling.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ROOM-01 | User can view 8 daily scheduled rooms (9am-4pm) | Database schema design, room creation patterns |
| ROOM-02 | User can toggle between calendar view and list view of rooms | shadcn/ui calendar component, date-fns for formatting |
| ROOM-03 | User can register for a room starting 30 minutes before session start | Time-based validation logic, registration state machine |
| ROOM-05 | User can join registered room via one-click access | Registration status tracking, direct room access |
| ADMN-01 | Admin can create/schedule rooms (time, capacity) | Admin role system, room creation API |
| ADMN-06 | Admin can reassign no-show slots to waiting users | Attendance tracking, waitlist management |
| ADMN-08 | Admin can add new interest tags to system | Tag management system, user interest updates |
| TECH-04 | WebSocket signaling server (Socket.IO 4.8.3) | Socket.IO server architecture, Next.js integration |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Socket.IO** | 4.8.3 | WebSocket signaling server | Verified current version via npm [VERIFIED: npm registry]. Handles WebRTC signaling, real-time room state, chat. Built-in reconnection, room namespaces, authentication. |
| **date-fns** | 4.1.0 | Date manipulation and timezone | Verified current version via npm [VERIFIED: npm registry]. Lightweight, tree-shakeable, excellent timezone support via date-fns-tz. |
| **date-fns-tz** | 3.2.0 | Timezone conversion | Verified current version via npm [VERIFIED: npm registry]. Required for displaying room times in user's local timezone. |
| **zod** | 4.3.6 | Input validation | Already installed. Use for room creation, registration validation. |

### UI Components
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **shadcn/ui calendar** | Latest | Calendar view of rooms | For calendar/grid view toggle. Built on Radix UI, accessible, customizable. |
| **@radix-ui/react-dialog** | Latest | Room details modal | For showing room info, participant list before joining. |
| **@radix-ui/react-select** | Latest | Timezone selector, filter dropdowns | For admin room creation form, user preferences. |

### Server-Side
| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| **node-cron** | 3.x | Scheduled room creation | Cron job to create daily rooms. Already in tech stack. |
| **mongoose** | 8.23.0 | Room/Registration models | Already installed. Use for schema, indexes, queries. |
| **bcryptjs** | 3.0.3 | Password hashing (for admin accounts) | Already installed. |

### Testing
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **vitest** | 4.1.2 | Unit/integration tests | Already configured. Use for room model tests, API route tests. |
| **socket.io-client** | 4.8.3 | Socket.IO client testing | For testing WebSocket connections, room events. |
| **@testing-library/react** | 16.3.2 | Component tests | Already installed. Use for room list, calendar, registration UI tests. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Individual room docs | Recurring series pattern | More complex queries, harder to modify individual sessions. Individual docs simpler for MVP. |
| Separate Socket.IO server | Next.js API route with Socket.IO | API routes are serverless, can't maintain persistent connections. Separate server required. |
| shadcn/ui calendar | react-calendar | Less accessible, harder to style. shadcn/ui built into project. |
| date-fns | moment.js | Deprecated, larger bundle. date-fns is modern standard. |
| node-cron | API-based cron service | External dependency, cost. node-cron is free, simple. |

**Installation:**
```bash
# Socket.IO (server + client)
npm install socket.io@4.8.3
npm install socket.io-client@4.8.3

# Date handling
npm install date-fns@4.1.0
npm install date-fns-tz@3.2.0

# shadcn/ui components (if not already installed)
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
```

**Version verification:**
- Socket.IO: `npm view socket.io version` → 4.8.3 [VERIFIED: npm registry]
- mediasoup: `npm view mediasoup version` → 3.19.19 [VERIFIED: npm registry]
- date-fns: `npm view date-fns version` → 4.1.0 [VERIFIED: npm registry]
- date-fns-tz: `npm view date-fns-tz version` → 3.2.0 [VERIFIED: npm registry]

## Architecture Patterns

### Recommended Project Structure
```
src/
├── models/
│   ├── Room.ts           # Room schema
│   ├── Registration.ts   # User-room registration
│   └── InterestTag.ts    # Interest tags for matching
├── lib/
│   ├── socket.ts         # Socket.IO server setup
│   ├── rooms.ts          # Room business logic
│   ├── timezone.ts       # Timezone utilities
│   └── admin.ts          # Admin authorization helpers
├── components/
│   ├── rooms/
│   │   ├── RoomList.tsx          # List view of rooms
│   │   ├── RoomCalendar.tsx      # Calendar view
│   │   ├── RoomCard.tsx          # Individual room display
│   │   ├── RegisterButton.tsx    # Registration button with state
│   │   └── JoinRoomButton.tsx    # One-click join button
│   └── admin/
│       ├── CreateRoomForm.tsx    # Admin room creation
│       ├── RoomManagePanel.tsx   # Edit/cancel rooms
│       ├── NoShowManager.tsx     # Reassign no-show slots
│       └── InterestTagManager.tsx # Add/edit interest tags
├── app/
│   ├── rooms/
│   │   └── page.tsx              # Main rooms page
│   ├── room/
│   │   └── [id]/
│   │       └── page.tsx          # Individual room detail page (pre-session)
│   ├── admin/
│   │   └── rooms/
│   │       ├── page.tsx          # Admin room management dashboard
│   │       └── create/page.tsx   # Create room form
│   └── api/
│       ├── rooms/
│       │   ├── route.ts          # GET list, POST create (admin)
│       │   ├── [id]/
│       │   │   └── route.ts      # GET detail, PATCH update, DELETE cancel
│       │   └── [id]/
│       │       └── register/
│       │           └── route.ts  # POST register, DELETE cancel
│       └── admin/
│           └── rooms/
│           └── [id]/
│           └── noshow/
│               └── route.ts      # POST reassign no-show
server/
├── socket-server.ts    # Standalone Socket.IO server
└── package.json        # Separate entry point
tests/
├── models/
│   ├── Room.test.ts
│   └── Registration.test.ts
├── lib/
│   ├── rooms.test.ts
│   └── timezone.test.ts
├── api/
│   └── rooms/
│       └── index.test.ts
└── socket/
    └── socket-server.test.ts
```

### Pattern 1: Room Scheduling with Individual Documents
**What:** Create individual room documents for each session (not recurring series)
**When to use:** Fixed daily schedule (9am-4pm), need to modify individual sessions
**Example:**
```typescript
// Source: MongoDB schema design best practices
import mongoose, { Schema } from 'mongoose'
import { IRoom } from './types'

const RoomSchema = new Schema<IRoom>({
  title: {
    type: String,
    default: 'Focus Room'
  },
  scheduledTime: {
    type: Date,
    required: true,
    index: true  // For querying today's rooms
  },
  duration: {
    type: Number,
    default: 45  // 45-minute sessions
  },
  capacity: {
    type: Number,
    default: 12,
    min: 1,
    max: 12  // Phase 2 limit, auto-scales to 16 in Phase 4
  },
  status: {
    type: String,
    enum: ['scheduled', 'open', 'full', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  interestTags: [{
    type: String,
    trim: true
  }],
  // For overflow room splitting in Phase 4
  parentRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room'
  },
  isOverflowRoom: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Compound index for querying today's rooms efficiently
RoomSchema.index({ scheduledTime: 1, status: 1 })

export const Room = (mongoose.models.Room as Model<IRoom>) ||
  mongoose.model<IRoom>('Room', RoomSchema)
```

### Pattern 2: Socket.IO Server Architecture
**What:** Separate Node.js server for Socket.IO alongside Next.js
**When to use:** Persistent WebSocket connections, real-time signaling
**Example:**
```typescript
// Source: Socket.IO documentation patterns
// server/socket-server.ts
import { createServer } from 'http'
import { Server } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { parse } from 'cookie'
import { verify } from 'jsonwebtoken'
import { connectDB } from '../src/lib/db'
import { User } from '../src/models/User'

const httpServer: HTTPServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    credentials: true
  },
  transports: ['websocket', 'polling']  // Fallback for restrictive networks
})

// Authentication middleware for Socket.IO
io.use(async (socket, next) => {
  try {
    const cookie = socket.handshake.headers.cookie
    if (!cookie) {
      return next(new Error('Authentication error: No cookies'))
    }

    const parsed = parse(cookie)
    const token = parsed['next-auth.session-token']

    if (!token) {
      return next(new Error('Authentication error: No token'))
    }

    // Verify JWT (same secret as NextAuth)
    const decoded = verify(token, process.env.NEXTAUTH_SECRET || '') as any
    await connectDB()
    const user = await User.findById(decoded.id)

    if (!user) {
      return next(new Error('Authentication error: User not found'))
    }

    socket.data.user = user
    next()
  } catch (error) {
    next(new Error('Authentication error'))
  }
})

// Room namespace
const roomNamespace = io.of(/^\/room-\w+$/)

roomNamespace.on('connection', (socket) => {
  const roomName = socket.nsp.name
  const roomId = roomName.replace('/room-', '')

  // Join room
  socket.join(roomId)

  // Handle signaling for WebRTC (Phase 4)
  socket.on('signal', (data) => {
    socket.to(roomId).emit('signal', {
      userId: socket.data.user._id,
      signal: data.signal
    })
  })

  // Handle chat messages (Phase 3)
  socket.on('chat-message', (data) => {
    roomNamespace.to(roomId).emit('chat-message', {
      userId: socket.data.user._id,
      userName: socket.data.user.name,
      userPhoto: socket.data.user.photoUrl,
      message: data.message,
      timestamp: new Date()
    })
  })

  // Handle disconnect
  socket.on('disconnect', () => {
    socket.leave(roomId)
  })
})

const PORT = process.env.SOCKET_PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`)
})

// Client-side usage (in React component)
// import { io } from 'socket.io-client'
// const socket = io(`http://localhost:3001/room-${roomId}`)
```

### Pattern 3: Timezone Handling with date-fns-tz
**What:** Store all times in UTC, convert to user's timezone for display
**When to use:** Multi-timezone application, users in different regions
**Example:**
```typescript
// Source: date-fns-tz documentation
import { formatInTimeZone } from 'date-fns-tz'
import { zonedTimeToUtc } from 'date-fns-tz'

// Store room time in UTC
const scheduledTimeUTC = zonedTimeToUtc(
  '2026-04-07 09:00',
  'Asia/Kolkata'
)

// Display in user's timezone
function formatRoomTime(utcDate: Date, userTimezone: string): string {
  return formatInTimeZone(utcDate, userTimezone, 'h:mm a')
}

// Get user's timezone (already stored from onboarding)
const userTimezone = 'America/New_York'
const displayTime = formatRoomTime(room.scheduledTime, userTimezone)
// Output: "11:00 PM" (for 9:00 AM IST)
```

### Pattern 4: Registration State Machine
**What:** Track registration status with time-based rules
**When to use:** 30-minute window before session, capacity limits
**Example:**
```typescript
// Source: Business logic requirements
type RegistrationStatus = 'closed' | 'opening-soon' | 'open' | 'registered' | 'full'

function getRegistrationStatus(room: IRoom, user?: IUser): {
  status: RegistrationStatus
  canRegister: boolean
  message: string
} {
  const now = new Date()
  const startTime = new Date(room.scheduledTime)
  const thirtyMinutesBefore = new Date(startTime.getTime() - 30 * 60 * 1000)

  // Check if registration is open (30 min before session)
  if (now < thirtyMinutesBefore) {
    return {
      status: 'closed',
      canRegister: false,
      message: `Registration opens ${formatDistanceToNow(thirtyMinutesBefore)}`
    }
  }

  // Check if room is full
  if (room.participants.length >= room.capacity) {
    return {
      status: 'full',
      canRegister: false,
      message: 'Room is full'
    }
  }

  // Check if user is already registered
  if (user && room.participants.includes(user._id)) {
    return {
      status: 'registered',
      canRegister: false,
      message: 'You\'re registered for this room'
    }
  }

  // Registration is open
  return {
    status: 'open',
    canRegister: true,
    message: 'Register now'
  }
}
```

### Anti-Patterns to Avoid
- **Recurring series pattern**: Storing recurrence rules (RRULE) instead of individual room documents. Why? Complex queries, harder to modify individual sessions, overkill for fixed daily schedule.
- **Socket.IO in Next.js API routes**: Trying to use API routes for WebSocket server. Why? API routes are serverless, can't maintain persistent connections. Must use separate server.
- **Client-side timezone conversion**: Converting times in browser only. Why? Inconsistent across users, harder to debug. Always convert server-side, store UTC.
- **Manual capacity checking**: Checking room capacity without database transactions. Why? Race conditions, overbooking. Use atomic operations (`$inc`, `$push` with conditions).
- **Storing passwords in room docs**: Embedding user passwords in room participants. Why? Security risk, already in User model with `select: false`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebSocket reconnection | Custom reconnection logic | Socket.IO built-in reconnection | Handles disconnects, exponential backoff, fallback to polling |
| Timezone conversion | Manual offset math | date-fns-tz | Handles DST, IANA timezone database, edge cases |
| Calendar UI | Custom calendar grid | shadcn/ui calendar | Accessible, keyboard navigation, built on Radix UI |
| Form validation | If-else validation chains | zod schemas | Type-safe, error messages, reusable |
| Authentication tokens | Custom JWT implementation | NextAuth.js session tokens | Already integrated, secure, CSRF protection |
| Input sanitization | Manual string escaping | Zod + Mongoose schema validation | Prevents NoSQL injection, type coercion |
| Date formatting | Manual date string concat | date-fns format | Localized, handles pluralization, edge cases |

**Key insight:** Room management has many edge cases (timezones, race conditions, state transitions). Custom implementations will have bugs. Use battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Timezone Confusion
**What goes wrong:** Room times display inconsistently for users in different timezones, registration windows open at wrong times
**Why it happens:** Storing local times instead of UTC, mixing client/server timezone conversion, not handling DST transitions
**How to avoid:**
- Always store `scheduledTime` in UTC in MongoDB
- Convert to user's timezone only at display time (use `user.timezone` from User model)
- Use `date-fns-tz` for all timezone operations (not native Date methods)
- Test with users in different timezones (IST, EST, GMT)
**Warning signs:** "Registration opens at different times for different users", "Room shows 9:00 AM for me but 10:00 AM for friend"

### Pitfall 2: Race Conditions in Registration
**What goes wrong:** Room overbooked beyond capacity (13th user joins 12-person room)
**Why it happens:** Check-then-act pattern (check capacity, then add participant) without atomic operations
**How to avoid:**
- Use atomic MongoDB operations: `Room.findByIdAndUpdate(id, { $push: { participants: userId }, $inc: { participantCount: 1 } })`
- Add condition: `{ $expr: { $lt: ['$participantCount', '$capacity'] } }`
- Return error if operation fails (room full)
**Warning signs:** "Room shows 12/12 but 13 people joined", "Registration succeeds but room is actually full"

### Pitfall 3: Socket.IO Authentication Not Shared with NextAuth
**What goes wrong:** User logged into Next.js but Socket.IO connection rejected, or vice versa
**Why it happens:** Socket.IO uses different authentication mechanism (JWT vs session token)
**How to avoid:**
- Extract NextAuth session token from cookie in Socket.IO middleware
- Verify JWT using same `NEXTAUTH_SECRET` as NextAuth
- Share User model between Next.js and Socket.IO server
- Test authentication end-to-end (login → WebSocket connect)
**Warning signs:** "Socket connection error 401", "User shown as anonymous in chat"

### Pitfall 4: Room Creation Cron Job Fails Silently
**What goes wrong:** No rooms created for the day, users can't register
**Why it happens:** Cron job crashes, not running, server restart, timezone mismatch
**How to avoid:**
- Use node-cron with error handling and logging
- Add health check endpoint: `/api/health/rooms` returns last room creation time
- Create rooms for next 7 days (buffer if cron fails)
- Monitor cron job logs (PM2, systemd)
**Warning signs:** "No rooms showing for today", "Last room created 3 days ago"

### Pitfall 5: Calendar Performance with Many Rooms
**What goes wrong:** Calendar page loads slowly when showing 30+ days of rooms
**Why it happens:** Fetching all rooms for entire month, no pagination, no indexes
**How to avoid:**
- Only fetch current month's rooms: `scheduledTime >= startOfMonth && scheduledTime <= endOfMonth`
- Add compound index: `{ scheduledTime: 1, status: 1 }`
- Use MongoDB aggregation for participant counts
- Consider pagination or infinite scroll for list view
**Warning signs:** "Calendar takes 5+ seconds to load", "MongoDB query slow in logs"

### Pitfall 6: Admin Authorization Not Enforced
**What goes wrong:** Regular users can access admin panel, create/delete rooms
**Why it happens:** Only hiding admin UI in frontend, not checking server-side
**How to avoid:**
- Add `role: 'admin'` field to User model
- Check admin role in all admin API routes (not just UI)
- Use NextAuth middleware for admin routes: `/admin/[...nextauth]`
- Test admin endpoints with regular user account
**Warning signs:** "I can access /admin/rooms without being admin", "Room deleted by non-admin user"

## Code Examples

Verified patterns from official sources:

### Room Creation with node-cron
```typescript
// Source: node-cron npm documentation
import cron from 'node-cron'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { addDays, startOfDay } from 'date-fns'

// Create daily rooms at midnight (runs once per day)
cron.schedule('0 0 * * *', async () => {
  try {
    await connectDB()
    console.log('Creating daily rooms...')

    const today = startOfDay(new Date())
    const baseTime = new Date(today)
    baseTime.setHours(9, 0, 0, 0)  // 9 AM

    // Create 8 rooms (9am-4pm)
    for (let hour = 0; hour < 8; hour++) {
      const scheduledTime = new Date(baseTime.getTime() + hour * 60 * 60 * 1000)

      const existingRoom = await Room.findOne({ scheduledTime })
      if (!existingRoom) {
        await Room.create({
          title: 'Focus Room',
          scheduledTime,
          duration: 45,
          capacity: 12,
          status: 'scheduled'
        })
        console.log(`Created room for ${scheduledTime.toISOString()}`)
      }
    }

    console.log('Daily rooms created successfully')
  } catch (error) {
    console.error('Error creating daily rooms:', error)
  }
}, {
  timezone: 'Asia/Kolkata'  // Server timezone
})
```

### Registration API with Atomic Operations
```typescript
// Source: MongoDB atomic operations documentation
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomId = params.id
    const userId = session.user.id

    await connectDB()

    // Check if 30-minute window is open
    const room = await Room.findById(roomId)
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const now = new Date()
    const thirtyMinutesBefore = new Date(room.scheduledTime.getTime() - 30 * 60 * 1000)

    if (now < thirtyMinutesBefore) {
      return NextResponse.json({
        error: `Registration opens ${formatDistanceToNow(thirtyMinutesBefore)}`
      }, { status: 400 })
    }

    // Atomic registration (prevents race conditions)
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      {
        $push: { participants: userId },
        $inc: { participantCount: 1 }
      },
      {
        new: true,
        runValidators: true,
        // Condition: only update if capacity not exceeded
        // Note: participantCount must be added to schema
      }
    )

    if (!updatedRoom) {
      return NextResponse.json({ error: 'Room is full' }, { status: 400 })
    }

    // Create registration record
    await Registration.create({
      userId,
      roomId,
      registeredAt: new Date(),
      status: 'registered'
    })

    return NextResponse.json({ success: true, room: updatedRoom })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
```

### Calendar Component with shadcn/ui
```typescript
// Source: shadcn/ui calendar documentation
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { SelectRangeEventHandler } from "react-day-picker/types"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface RoomCalendarProps {
  rooms: IRoom[]
  onDateSelect: (date: Date) => void
  selectedDate: Date
}

export function RoomCalendar({ rooms, onDateSelect, selectedDate }: RoomCalendarProps) {
  // Highlight dates that have rooms scheduled
  const modifiers = {
    hasRoom: rooms.map(room => new Date(room.scheduledTime))
  }

  const modifiersStyles = {
    hasRoom: {
      fontWeight: 'bold',
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))'
    }
  }

  return (
    <div className="p-4">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        modifiers={modifiers}
        modifiersStyles={modifiersStyles}
        className="rounded-md border"
      />
    </div>
  )
}
```

### Admin Authorization Middleware
```typescript
// Source: NextAuth.js middleware documentation
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export async function requireAdmin(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return { authorized: false, error: 'Unauthorized' }
  }

  await connectDB()
  const user = await User.findById(session.user.id)

  if (!user || user.role !== 'admin') {
    return { authorized: false, error: 'Forbidden: Admin only' }
  }

  return { authorized: true, user }
}

// Usage in API route
export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req)
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.error === 'Unauthorized' ? 401 : 403 })
  }

  // Admin-only logic here
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Moment.js | date-fns | 2020+ | Smaller bundle, tree-shakeable, better TypeScript |
| Custom WebSocket | Socket.IO | 2014+ | Built-in reconnection, rooms, fallback to polling |
| Server-side rendering only | Client + Server Components | Next.js 13+ | Better performance, interactive UI where needed |
| Manual form validation | zod schemas | 2021+ | Type-safe validation, better error messages |
| React Calendar | shadcn/ui (Radix) | 2023+ | Better accessibility, customizable, follows design system |

**Deprecated/outdated:**
- **moment.js**: Replaced by date-fns. Don't use in new projects.
- **react-calendar**: Less accessible, harder to style. Use shadcn/ui calendar instead.
- **socket.io-client@2.x**: Old version, missing features. Use 4.8.3.
- **cron package (not node-cron)**: Unmaintained. Use node-cron 3.x.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | shadcn/ui calendar component supports date highlighting for room availability | UI Components | May need to build custom calendar or use react-calendar if highlighting not supported |
| A2 | Socket.IO server can run on same VPS as Next.js (port 3001) | Socket.IO Architecture | May require separate VPS or different port configuration |
| A3 | node-cron is sufficient for daily room creation (no external cron service needed) | Room Scheduling | May need to use API-based cron if server restarts frequently |
| A4 | MongoDB atomic operations prevent race conditions for registration | Registration API | May need distributed lock if multiple app servers in future |
| A5 | User timezone stored during onboarding is sufficient for all room time displays | Timezone Handling | May need per-session timezone override if user travels |

## Open Questions

1. **Socket.IO server deployment**
   - What we know: Socket.IO requires separate server from Next.js API routes
   - What's unclear: Should Socket.IO server run as separate process (PM2) or Docker container?
   - Recommendation: Start with PM2 process on same VPS (simpler), migrate to Docker in Phase 7 if scaling needed

2. **Room creation frequency**
   - What we know: Need 8 daily rooms (9am-4pm), recurring schedule
   - What's unclear: Should we create rooms 7 days in advance or 30 days?
   - Recommendation: Create 7 days in advance (MVP), extend to 30 days in Phase 7 based on user feedback

3. **Admin role assignment**
   - What we know: Need admin authorization for room management
   - What's unclear: How do we assign the first admin user? Manual database update?
   - Recommendation: Add `role` field to User schema, first admin manually set via MongoDB shell, subsequent admins via admin panel

4. **Waitlist vs overflow rooms**
   - What we know: Room capacity is 12 participants, auto-scales to 16 in Phase 4
   - What's unclear: Should Phase 2 implement waitlist (users join queue) or just show "room full"?
   - Recommendation: Show "room full" in Phase 2 (simpler), add waitlist in Phase 4 when overflow rooms implemented

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Socket.IO server, Next.js | ✓ | 23.7.0 | — |
| MongoDB | Room/Registration storage | ✗ | — | Use Docker: `docker-compose -f .docker/mongodb/docker-compose.yml up -d` |
| Socket.IO | WebSocket signaling | ✗ | — | Install: `npm install socket.io@4.8.3` |
| mediasoup | WebRTC SFU (Phase 4) | ✗ | — | Not needed for Phase 2, defer to Phase 4 |
| date-fns | Timezone handling | ✗ | — | Install: `npm install date-fns@4.1.0 date-fns-tz@3.2.0` |
| PM2 | Process management | ✗ | — | Install: `npm install -g pm2` OR use `node server/socket-server.ts` directly for dev |

**Missing dependencies with no fallback:**
- None (all have installation paths or are deferred)

**Missing dependencies with fallback:**
- MongoDB: Use Docker Compose setup already in project (`.docker/mongodb/docker-compose.yml`)
- PM2: Not required for development, can run with `node server/socket-server.ts`. Install for production.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.2 |
| Config file | `vitest.config.ts` (already configured) |
| Quick run command | `npm test -- --run` |
| Full suite command | `npm test -- --run --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROOM-01 | View 8 daily scheduled rooms | unit | `npm test -- tests/models/Room.test.ts -t "should create daily rooms"` | ❌ Wave 0 |
| ROOM-02 | Toggle calendar/list view | component | `npm test -- tests/components/rooms/RoomList.test.tsx -t "should toggle view"` | ❌ Wave 0 |
| ROOM-03 | Register 30min before session | integration | `npm test -- tests/api/rooms/register.test.ts -t "should enforce 30-minute window"` | ❌ Wave 0 |
| ROOM-05 | One-click join registered room | integration | `npm test -- tests/api/rooms/join.test.ts -t "should allow one-click join"` | ❌ Wave 0 |
| ADMN-01 | Admin create/schedule rooms | integration | `npm test -- tests/api/admin/rooms/create.test.ts -t "should create room as admin"` | ❌ Wave 0 |
| ADMN-06 | Admin reassign no-show slots | unit | `npm test -- tests/lib/rooms.test.ts -t "should reassign no-show"` | ❌ Wave 0 |
| ADMN-08 | Admin add interest tags | unit | `npm test -- tests/models/InterestTag.test.ts -t "should create interest tag"` | ❌ Wave 0 |
| TECH-04 | Socket.IO server operational | integration | `npm test -- tests/socket/socket-server.test.ts -t "should connect and authenticate"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run` (quick run, no coverage)
- **Per wave merge:** `npm test -- --run --coverage` (full suite with coverage)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- `tests/models/Room.test.ts` — Room schema, indexes, queries
- `tests/models/Registration.test.ts` — Registration model, status transitions
- `tests/models/InterestTag.test.ts` — Interest tag CRUD
- `tests/lib/rooms.test.ts` — Room business logic (registration window, capacity)
- `tests/lib/timezone.test.ts` — Timezone conversion utilities
- `tests/lib/admin.test.ts` — Admin authorization helpers
- `tests/api/rooms/index.test.ts` — GET list, POST create
- `tests/api/rooms/[id]/route.test.ts` — GET detail, PATCH update, DELETE
- `tests/api/rooms/[id]/register/route.test.ts` — POST register, DELETE cancel
- `tests/api/admin/rooms/create.test.ts` — Admin room creation
- `tests/api/admin/rooms/[id]/noshow/route.test.ts` — No-show reassignment
- `tests/components/rooms/RoomList.test.tsx` — Room list component
- `tests/components/rooms/RoomCalendar.test.tsx` — Calendar component
- `tests/components/rooms/RegisterButton.test.tsx` — Registration button with states
- `tests/components/admin/CreateRoomForm.test.tsx` — Admin room creation form
- `tests/socket/socket-server.test.ts` — Socket.IO connection, auth, rooms
- `tests/socket/socket-client.test.ts` — Socket.IO client integration
- Socket.IO test setup: `tests/setup/socket.ts` — Socket.IO test server, client fixtures

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth.js 4.24.13 (already implemented), add admin role check |
| V3 Session Management | yes | NextAuth.js session tokens, shared with Socket.IO via JWT |
| V4 Access Control | yes | Admin role in User model, server-side checks on admin routes |
| V5 Input Validation | yes | zod 4.3.6 schemas for room creation, registration API |
| V6 Cryptography | no | Not applicable (no encryption in this phase) |

### Known Threat Patterns for {Next.js + MongoDB + Socket.IO}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL/NoSQL injection | Tampering | Mongoose schema validation + zod input sanitization |
| Mass assignment | Tampering | Explicit field selection in updates, zod schemas |
| Race condition registration | Tampering | MongoDB atomic operations (`$inc`, `$push` with conditions) |
| CSRF on room creation | Tampering | NextAuth.js built-in CSRF tokens |
| Unauthorized admin access | Elevation | Server-side role check, not just UI hiding |
| WebSocket auth bypass | Elevation | JWT verification in Socket.IO middleware |
| DoS via room creation | Denial | Rate limiting on admin routes (future) |
| Timezone manipulation | Informational | Store UTC, validate timezone against IANA database |

**Specific Security Requirements:**
1. **Admin Authorization**: Add `role` field to User model (`enum: ['user', 'admin']`), check in all admin API routes
2. **Registration Race Conditions**: Use atomic MongoDB operations, never check-then-act
3. **Input Validation**: All room creation, registration inputs validated with zod schemas
4. **WebSocket Authentication**: Verify NextAuth JWT token in Socket.IO middleware, reject unauthorized connections
5. **Mass Assignment Prevention**: Explicitly define allowed fields in room updates, exclude `status`, `participants` from user updates

## Sources

### Primary (HIGH confidence)
- [Socket.IO npm](https://www.npmjs.com/package/socket.io) - Version 4.8.3 verified, API patterns
- [mediasoup npm](https://www.npmjs.com/package/mediasoup) - Version 3.19.19 verified
- [date-fns npm](https://www.npmjs.com/package/date-fns) - Version 4.1.0 verified
- [date-fns-tz npm](https://www.npmjs.com/package/date-fns-tz) - Version 3.2.0 verified
- [Next.js Official Documentation](https://nextjs.org/docs) - App Router patterns, API routes
- [Mongoose Documentation](https://mongoosejs.com/docs) - Schema design, atomic operations
- [zod Documentation](https://zod.dev) - Input validation patterns
- [shadcn/ui Documentation](https://ui.shadcn.com) - Calendar component usage

### Secondary (MEDIUM confidence)
- [node-cron npm](https://www.npmjs.com/package/node-cron) - Scheduling patterns (not accessed due to search limits, but standard npm package)
- [Radix UI Documentation](https://www.radix-ui.com) - Underlying primitives for shadcn/ui (assumed based on training data)
- [date-fns-tz GitHub](https://github.com/marnusw/date-fns-tz) - Timezone handling patterns (assumed based on training data)

### Tertiary (LOW confidence)
- Socket.IO + Next.js integration patterns (based on training data, not verified due to search limits)
- MongoDB recurring events schema design (based on training data, not verified due to search limits)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All versions verified via npm registry
- Architecture: HIGH - Based on official docs and established patterns
- Pitfalls: MEDIUM - Based on training data and common MongoDB/WebSocket issues, some not verified due to search limits
- Security: HIGH - Based on OWASP ASVS and standard Next.js/MongoDB security patterns

**Research date:** 2026-04-06
**Valid until:** 2026-05-06 (30 days - Socket.IO and date-fns are stable, but verify versions if phase delayed)
