# Architecture Patterns

**Domain:** Real-time video accountability platform (WebRTC-based focus rooms)
**Researched:** 2026-04-06

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Next.js Frontend                               │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │   Auth      │  │  Room UI     │  │  Dashboard  │  │   Profile    │     │
│  │  Context    │  │  (WebRTC)    │  │   View      │  │  Management  │     │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘     │
│         │                   │                  │                │           │
│         └───────────────────┴──────────────────┴────────────────┘           │
│                                      │                                       │
│                                      ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        WebSocket Client (Socket.io)                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js API Routes                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │   Auth      │  │  Room        │  │  Payment    │  │   Email      │     │
│  │  Routes     │  │  Routes      │  │  Routes     │  │   Routes     │     │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘     │
│         │                   │                  │                │           │
└─────────┴───────────────────┴──────────────────┴────────────────┘           │
                                     │                                          │
                                     ▼                                          │
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Service Layer                                    │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐     │
│  │   Auth      │  │  Signaling   │  │  Room       │  │  Payment     │     │
│  │  Service    │  │  Service     │  │  Manager    │  │  Service     │     │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘     │
│                                          │                                  │
│                              ┌───────────┴───────────┐                      │
│                              │   WebSocket Server    │                      │
│                              │   (Socket.io)         │                      │
│                              └───────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────────┘
                │                               │                    │
                ▼                               ▼                    ▼
┌───────────────────┐           ┌─────────────────────┐    ┌──────────────────┐
│   MongoDB         │           │  Mediasoup SFU      │    │   External       │
│   (Prisma)        │           │  (Media Server)     │    │   Services       │
│                   │           │                     │    │  - Razorpay      │
│ - Users           │           │ - Router            │    │  - Razorpay      │
│ - Rooms           │           │ - Transport         │    │  - Email SMTP    │
│ - Sessions        │           │ - Producer          │    │  - TURN Server   │
│ - Subscriptions   │           │ - Consumer          │    │    (Coturn)      │
│ - Tasks           │           │                     │    │                  │
└───────────────────┘           └─────────────────────┘    └──────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Next.js Frontend** | User interface, authentication state, video UI, room management UI | API Routes, WebSocket Server |
| **API Routes** | HTTP endpoints for auth, payments, CRUD operations, webhooks | Services Layer, Database, External APIs |
| **WebSocket Server** | Real-time signaling, room presence, chat messages, captain controls | Frontend Clients, Room Manager |
| **Signaling Service** | WebRTC offer/answer exchange, ICE candidate handling, connection state | WebSocket Server, Mediasoup SFU |
| **Room Manager** | Room lifecycle, capacity management, overflow logic, session state | Database, WebSocket Server, Notification Service |
| **Mediasoup SFU** | Video/audio routing, transcoding, recording, bitrate adaptation | Signaling Service, TURN Server |
| **Auth Service** | User authentication, session management, authorization checks | Database, API Routes |
| **Payment Service** | Subscription management, payment processing, session limit enforcement | Razorpay API, Database |
| **Notification Service** | Email reminders, no-show alerts, session confirmations | SMTP Service, Database |

## Data Flow

### 1. User Joins Room Flow

```
User Browser                WebSocket Server           Room Manager              Database
     │                             │                        │                      │
     │──── JOIN_ROOM(req) ────────▶│                        │                      │
     │                             │                        │                      │
     │                             │─── validate_room() ───▶│                      │
     │                             │                        │                      │
     │                             │                        │─── GET /rooms/{id} ─▶│
     │                             │                        │                      │
     │                             │                        │◀── room details ─────│
     │                             │                        │                      │
     │                             │◀── room_capacity_check │                      │
     │                             │                        │                      │
     │◀── ROOM_FULL / ALLOWED ─────│                        │                      │
     │                             │                        │                      │
     │ (if allowed)                │                        │                      │
     │                             │                        │                      │
     │──── INIT_WEBRTC ───────────▶│                        │                      │
     │                             │                        │                      │
     │                             │─── create_router() ───────────────────────▶│
     │                             │                        │                      │
     │◀── ROUTER_ID ───────────────│                        │                      │
     │                             │                        │                      │
     │──── TRANSPORT_CREATE ──────▶│──────▶ Mediasoup SFU   │                      │
     │                             │                        │                      │
     │◀── TRANSPORT_INFO ──────────│                        │                      │
     │                             │                        │                      │
     │──── PRODUCE (audio/video) ─▶│──────▶ Mediasoup SFU   │                      │
     │                             │                        │                      │
     │◀── PRODUCER_ID ────────────│                        │                      │
     │                             │                        │                      │
     │──── CONSUME (others) ──────▶│──────▶ Mediasoup SFU   │                      │
     │                             │                        │                      │
     │◀── CONSUMER_IDS ───────────│                        │                      │
```

### 2. Signaling Flow (WebRTC Connection Setup)

```
Peer A                          WebSocket Server              Peer B
  │                                    │                        │
  │──── OFFER (SDP) ──────────────────▶│                        │
  │                                    │───── forward ──────────▶│
  │                                    │                        │
  │                                    │◀── ANSWER (SDP) ────────│
  │◀── ANSWER ─────────────────────────│                        │
  │                                    │                        │
  │──── ICE_CANDIDATE ─────────────────│───────▶                │
  │                                    │                        │
  │◀── ICE_CANDIDATE ──────────────────│◀───────────────────────│
  │                                    │                        │
  │ (repeat until connection established)                       │
```

### 3. Room State Synchronization

```
Room Manager                    Redis Pub/Sub                 WebSocket Servers
  │                                  │                              │
  │──── STATE_CHANGE ──────────────▶│                              │
  │  (user joined, muted, etc)      │                              │
  │                                  │───── PUBLISH ────────────────│
  │                                  │     (room:{id}:state)        │
  │                                  │                              │
  │                                  │                              │─── BROADCAST ───▶ Clients
  │                                  │                              │
  │                                  │         (same for all        │
  │                                  │          WebSocket instances)│
```

### 4. Payment Flow

```
User Browser               API Routes                  Payment Service           Razorpay
    │                         │                             │                         │
    │──── INITIATE_PAYMENT ──▶│                             │                         │
    │                         │                             │─── create_order ───────▶│
    │                         │                             │                         │
    │                         │                             │◀── order_id, amount ────│
    │                         │                             │                         │
    │◀── payment_details ─────│                             │                         │
    │  ( Razorpay checkout)   │                             │                         │
    │                         │                             │                         │
    │──── payment_success ───▶│                             │                         │
    │                         │──── verify_signature ──────▶│                         │
    │                         │                             │                         │
    │                         │──── UPDATE subscription ────────────────────────────▶ DB
    │                         │                             │                         │
    │◀── subscription_activated│                             │                         │
```

## Patterns to Follow

### Pattern 1: Single Server WebSocket with Adapter
**What:** Use Socket.io with Redis adapter for horizontal scaling
**When:** When you need to scale WebSocket connections across multiple servers
**Example:**
```typescript
// server.ts
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const io = new Server(3000, {
  cors: { origin: "*" }
});

const redisClient = createClient({ url: process.env.REDIS_URL });
const subClient = redisClient.duplicate();

await Promise.all([redisClient.connect(), subClient.connect()]);

io.adapter(createAdapter(redisClient, subClient));

// Room namespace
const roomNamespace = io.of("/rooms");

roomNamespace.on("connection", (socket) => {
  socket.on("join-room", async (roomId: string, userId: string) => {
    await socket.join(roomId);
    socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
  });

  socket.on("signal", (data) => {
    socket.to(data.targetSocketId).emit("signal", {
      signal: data.signal,
      senderId: socket.id
    });
  });

  socket.on("disconnecting", () => {
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      socket.to(room).emit("user-left", { socketId: socket.id });
    });
  });
});
```

### Pattern 2: Mediasoup Room Management
**What:** Use Mediasoup Router-Transport-Producer-Consumer hierarchy
**When:** For multi-party video rooms with efficient media routing
**Example:**
```typescript
// roomManager.ts
import { mediasoup } from "mediasoup";

interface Room {
  router: mediasoup.types.Router;
  transports: Map<string, mediasoup.types.WebRtcTransport>;
  producers: Map<string, mediasoup.types.Producer>;
  consumers: Map<string, mediasoup.types.Consumer>;
}

class RoomManager {
  private rooms = new Map<string, Room>();

  async createRoom(roomId: string): Promise<Room> {
    const worker = await this.getWorker();
    const router = await worker.createRouter({
      mediaCodecs: [
        { kind: "audio", mimeType: "audio/opus" },
        { kind: "video", mimeType: "video/VP8" }
      ]
    });

    this.rooms.set(roomId, {
      router,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map()
    });

    return this.rooms.get(roomId)!;
  }

  async addTransport(roomId: string, socketId: string) {
    const room = this.rooms.get(roomId);
    const transport = await room.router.createWebRtcTransport({
      listenInfos: [{ protocol: "udp", ip: "0.0.0.0", announcedIp: null }],
      enableTcp: true,
      preferUdp: true
    });

    room.transports.set(socketId, transport);
    return transport;
  }
}
```

### Pattern 3: Room Capacity Management with Overflow
**What:** Monitor room participants and auto-scale when capacity exceeded
**When:** For rooms with hard limits (12 users) with overflow handling
**Example:**
```typescript
// capacityManager.ts
interface RoomCapacity {
  current: number;
  max: number;
  overflowMax: number;
  overflowRoom?: string;
}

class CapacityManager {
  private capacities = new Map<string, RoomCapacity>();

  async checkCapacity(roomId: string): Promise<{
    canJoin: boolean;
    roomToJoin: string;
  }> {
    const capacity = this.capacities.get(roomId) || {
      current: 0,
      max: 12,
      overflowMax: 16
    };

    if (capacity.current < capacity.max) {
      return { canJoin: true, roomToJoin: roomId };
    }

    if (capacity.current < capacity.overflowMax) {
      // Create overflow room
      if (!capacity.overflowRoom) {
        capacity.overflowRoom = `${roomId}-overflow-${Date.now()}`;
        await this.createOverflowRoom(capacity.overflowRoom);
      }
      return { canJoin: true, roomToJoin: capacity.overflowRoom };
    }

    return { canJoin: false, roomToJoin: "" };
  }

  private async createOverflowRoom(roomId: string) {
    // Create new room with same settings
    // Notify admin about overflow
  }
}
```

### Pattern 4: Task Carry-over System
**What:** Link tasks between sessions when incomplete
**When:** For task persistence across focus rooms
**Example:**
```typescript
// taskService.ts
interface Task {
  id: string;
  userId: string;
  content: string;
  completedAt?: Date;
  carriedOverFrom?: string;
  roomId: string;
}

class TaskService {
  async carryOverIncompleteTasks(userId: string, fromRoom: string, toRoom: string) {
    const incompleteTasks = await prisma.task.findMany({
      where: {
        userId,
        roomId: fromRoom,
        completedAt: null
      }
    });

    if (incompleteTasks.length === 0) return [];

    const carriedTasks = await Promise.all(
      incompleteTasks.map(task =>
        prisma.task.create({
          data: {
            userId: task.userId,
            content: task.content,
            roomId: toRoom,
            carriedOverFrom: task.id
          }
        })
      )
    );

    // Mark original tasks as carried over
    await prisma.task.updateMany({
      where: { id: { in: incompleteTasks.map(t => t.id) } },
      data: { carriedOverTo: toRoom }
    });

    return carriedTasks;
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Direct P2P Mesh for >3 Users
**What:** Connecting every peer to every other peer directly
**Why bad:** O(n^2) connection complexity. 12 users = 132 connections. Browser CPU melts.
**Instead:** Use SFU (Selective Forwarding Unit) architecture like Mediasoup

### Anti-Pattern 2: WebSocket-over-HTTP Polling Fallback
**What:** Relying on long-polling when WebSocket fails
**Why bad:** High latency, breaks real-time nature of video signaling
**Instead:** Require WebSocket connections with explicit error messaging

### Anti-Pattern 3: Storing Room State in Memory Only
**What:** Keeping room participants, tasks only in server memory
**Why bad:** Server restart = lost state. No recovery from crashes
**Instead:** Persist critical state to database, use Redis for ephemeral state

### Anti-Pattern 4: Synchronous WebRTC Signaling
**What:** Blocking operations during offer/answer exchange
**Why bad:** Times out under load, poor UX
**Instead:** Async/await throughout, queue signaling messages

### Anti-Pattern 5: No TURN Server Fallback
**What:** Only using STUN, skipping TURN deployment
**Why bad:** 30-40% of users behind symmetric NAT can't connect
**Instead:** Always deploy Coturn TURN server for production

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **WebSocket Connections** | Single server (Node.js) | Multiple servers + Redis adapter | Load balancer + multiple regions |
| **Video Routing** | 1 Mediasoup worker (8 rooms) | 4-8 Mediasoup workers (32-64 rooms) | Dedicated media servers, geo-distributed |
| **Database** | MongoDB on VPS | MongoDB with connection pooling | Sharded MongoDB cluster |
| **TURN Server** | Single Coturn instance | 2-3 Coturn instances with LB | Regional TURN servers |
| **Session Storage** | In-memory | Redis cluster | Redis Cluster + persistence |

### Room Scaling Strategy

**Phase 1 (MVP):**
- 8 rooms/day, 12 users each = 96 concurrent users max
- Single Mediasoup worker handles ~100-200 consumers
- One VPS sufficient

**Phase 2 (Growth):**
- Add more rooms throughout day
- Multiple Mediasoup workers with load balancer
- Horizontal WebSocket scaling with Redis adapter

**Phase 3 (Scale):**
- Peak concurrent users >1000
- Dedicated media servers
- Consider managed WebRTC service or build media server cluster

## Database Schema Considerations

### Key Collections/Tables

```prisma
model User {
  id            String    @id
  email         String    @unique
  name          String?
  interests     String[]  // Tags from onboarding
  occupation    String?
  expertise     String[]
  sessions      Session[] @relation("UserSessions")
  tasks         Task[]
  subscription  Subscription?
  captainSince  DateTime?
  createdAt     DateTime  @default(now())
}

model Room {
  id              String    @id
  name            String
  scheduledFor    DateTime
  capacity        Int       @default(12)
  overflowRoomId  String?
  captainId       String?
  participants    Participant[]
  tasks           Task[]
  status          RoomStatus @default(SCHEDULED)
  createdAt       DateTime  @default(now())
}

model Participant {
  id          String   @id
  roomId      String
  userId      String
  joinedAt    DateTime
  leftAt      DateTime?
  attended    Boolean  @default(false) // 90+ seconds
  muted       Boolean  @default(true)
}

model Task {
  id               String   @id
  userId           String
  roomId           String
  content          String
  completedAt      DateTime?
  carriedOverFrom  String?
  createdAt        DateTime @default(now())
}

model Session {
  id          String   @id
  roomId      String
  userId      String
  startedAt   DateTime
  completedAt DateTime?
}

model Subscription {
  id          String          @id
  userId      String          @unique
  plan        SubscriptionPlan
  sessionsUsed Int            @default(0)
  sessionsLimit Int
  expiresAt   DateTime
  razorpaySubscriptionId String?
}
```

## Real-time Communication: WebSockets vs WebRTC Data Channels

### Use WebSockets (Socket.io) for:
- Signaling (offer/answer/ICE exchange)
- Chat messages
- Room state updates
- Captain controls (mute/unmute)
- Presence information

### Use WebRTC Data Channels for:
- **Not needed for MVP** - adds complexity
- Consider for Phase 2 if:
  - Direct peer-to-peer file sharing
  - Low-latency gaming features
  - Server-less messaging fallback

**Recommendation:** Stick to WebSocket for all control signaling. Data channels add implementation complexity with minimal benefit for focus room use case.

## Payment Integration Architecture

### Razorpay Integration Pattern

```typescript
// paymentService.ts
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

class PaymentService {
  async createSubscription(userId: string, plan: SubscriptionPlan) {
    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan,
        sessionsUsed: 0,
        sessionsLimit: plan === "WEEKLY" ? 8 : 32,
        expiresAt: this.calculateExpiry(plan)
      }
    });

    const razorpayOrder = await razorpay.orders.create({
      amount: this.getAmount(plan),
      currency: "INR",
      receipt: subscription.id,
      notes: { userId, plan }
    });

    return { subscription, razorpayOrder };
  }

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(orderId + "|" + paymentId);
    const generatedSignature = hmac.digest("hex");

    const isValid = generatedSignature === signature;

    if (isValid) {
      await prisma.subscription.update({
        where: { id: orderId },
        data: { active: true }
      });
    }

    return isValid;
  }
}
```

## Suggested Build Phases

### Phase 1: Foundation (No Video)
1. User authentication (Auth.js + Prisma)
2. Database schema setup
3. Basic room management UI
4. Session registration system
5. Admin panel for room scheduling

**Why:** Test core user flows before video complexity

### Phase 2: Real-time Infrastructure
1. WebSocket server setup (Socket.io)
2. Redis adapter for scaling readiness
3. Room state management
4. Presence system
5. Chat functionality

**Why:** Real-time features need solid foundation before adding video

### Phase 3: WebRTC Integration
1. TURN server deployment (Coturn)
2. Mediasoup SFU setup
3. Signaling service
4. Basic video/audio routing
5. Mute/unmute controls

**Why:** Video is most complex; build on proven real-time foundation

### Phase 4: Room Features
1. Task submission system
2. Carry-over logic
3. Captain controls
4. Attendance tracking (90-second rule)
5. Completion check flow

**Why:** These features depend on video working reliably

### Phase 5: Payments & Notifications
1. Razorpay integration
2. Subscription management
3. Session limit enforcement
4. Email notifications (reminders, no-shows)
5. Webhook handling

**Why:** Can test independently; doesn't block video features

### Phase 6: Polish & Monitoring
1. Video quality monitoring
2. Connection diagnostics
3. Analytics (attendance, completion rates)
4. Performance optimization
5. Error handling improvements

## Sources

- Mediasoup (v3.19.19): [https://mediasoup.org](https://mediasoup.org) - HIGH confidence (npm package verified)
- Socket.io (v4.8.3): [https://github.com/socketio/socket.io](https://github.com/socketio/socket.io) - HIGH confidence (npm package verified)
- Socket.io Redis Adapter: [https://github.com/socketio/socket.io-redis-adapter](https://github.com/socketio/socket.io-redis-adapter) - HIGH confidence (npm package verified)
- Redis (v5.11.0): [https://github.com/redis/node-redis](https://github.com/redis/node-redis) - HIGH confidence (npm package verified)
- Prisma (v7.6.0): [https://www.prisma.io](https://www.prisma.io) - HIGH confidence (npm package verified)
- Auth.js Prisma Adapter: [https://authjs.dev/reference/adapter/prisma](https://authjs.dev/reference/adapter/prisma) - HIGH confidence (npm package verified)
- Razorpay SDK (v2.9.6): [https://github.com/razorpay/razorpay-node](https://github.com/razorpay/razorpay-node) - HIGH confidence (npm package verified)
- Nodemailer (v8.0.4): [https://nodemailer.com](https://nodemailer.com) - HIGH confidence (npm package verified)
- webrtc-rooms (v2.0.0): [https://github.com/himanshu-pandey-git/webrtc-rooms](https://github.com/himanshu-pandey-git/webrtc-rooms) - MEDIUM confidence (emerging package, verified on npm)
- Coturn: Standard TURN server - LOW confidence (not verified via current sources, standard practice assumption)
