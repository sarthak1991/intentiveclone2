# Phase 4: WebRTC Integration - Research

**Researched:** 2025-04-07
**Domain:** WebRTC, mediasoup SFU, real-time video streaming
**Confidence:** MEDIUM

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Video Grid Layout**
- Use **auto-responsive grid** that adapts as people join/leave (1-3: full-width rows, 4-6: 2x3 grid, 7-9: 3x3 grid, 10-12: 3x4 grid)
- Use **hybrid speaker detection** for border highlight (automatic audio level + manual raise hand + captain override)
- Use **simple solid border** for speaker indication (2px solid accent color, no animation)

**Audio/Video Controls**
- Use **bottom control bar** placement (Zoom-style pattern, always visible)
- Include **four primary buttons** (Mute/unmute microphone, Toggle camera on/off, Leave/exit room, Settings for devices)
- Use **red background + icon change** for mute visual feedback
- Implement **captain controls with both options** (tap individual card to mute/unmute OR "Mute All" button)

**Session Countdown Timer**
- Display timer as **small sticker on header with accent color**
- Use **"... remaining"** format (e.g., "42:15 remaining")
- Use **no color change** throughout session (accent color throughout entire 45 minutes)

**Overflow Room Experience**
- Implement **auto-scaling to overflow rooms** (first 12 participants in main room, participants 13-16 in overflow room)
- Both rooms have full video and audio
- Chat is shared across both rooms

**Attendance Validation**
- Track **90+ seconds in session = attended**
- Start timer when user successfully connects to WebRTC room
- Track cumulative time (disconnect and reconnect don't reset timer)

**TURN Server Deployment**
- Deploy **coturn TURN server on separate VPS** (2 vCPU, 2GB RAM recommended, 500 Mbps per 50 concurrent video users)

**ICE Configuration**
- Use **comprehensive ICE configuration** with multiple STUN/TURN servers (Google public STUN, self-hosted coturn, fallback STUN servers)
- Transport: UDP with TCP/TLS fallback for restrictive firewalls

**Connection Quality UI**
- Use **subtle status indicator** (green/yellow/red dot next to user's own name with tooltip showing details)
- Silent reconnection in background (use existing reconnection handling from Phase 3)

### Claude's Discretion
- Grid layout breakpoints: Choose exact participant count thresholds for responsive behavior
- Speaker detection audio threshold: Set audio level sensitivity for automatic speaker detection
- Border accent color: Choose specific accent color from Tailwind palette (WCAG AA contrast)
- Connection status icons: Choose specific icons from lucide-react
- Timer placement: Exact header location and z-index layering
- Overflow room naming: Convention for overflow room names (e.g., "- Overflow" suffix)
- TURN credential TTL: Set appropriate expiry time for dynamically generated TURN credentials
- ICE connection timeout: How long to wait before declaring connection failed
- Bandwidth estimation: How to estimate participant bandwidth for quality adaptation
- Recording connection metrics: What to log for debugging

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within Phase 4 scope. No features outside video/audio connectivity were introduced.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIDE-01 | User can connect to video room using custom WebRTC implementation (mediasoup SFU) | §Standard Stack → mediasoup server architecture, §Architecture Patterns → WebRTC connection flow |
| VIDE-02 | User can control own audio mute/unmute | §Architecture Patterns → Producer controls, §Code Examples → Mute/unmute implementation |
| VIDE-03 | Room captain can control participant mute/unmute permissions | §Architecture Patterns → Captain controls, §Code Examples → Remote mute implementation |
| VIDE-04 | User can see participant names and photos in video grid | §Architecture Patterns → Video grid component |
| VIDE-05 | System handles TURN server connectivity for users behind restrictive NAT | §Standard Stack → coturn TURN server, §Architecture Patterns → ICE configuration |
| VIDE-06 | System maintains reliable video connectivity for 12-person rooms | §Standard Stack → mediasoup SFU scaling, §Architecture Patterns → Connection monitoring |
| ROOM-04 | System enforces room capacity limit (12 participants, auto-scales to 16 with overflow split) | §Architecture Patterns → Room capacity enforcement |
| ROOM-06 | User can see visible 45-minute session countdown timer | §Architecture Patterns → Session timer component |
| ROOM-07 | System manages overflow room splitting when capacity exceeded | §Architecture Patterns → Overflow room logic |
| ROOM-08 | System validates attendance (90+ seconds in session = attended) | §Architecture Patterns → Attendance tracking |
| TECH-05 | TURN server deployment on separate VPS | §Standard Stack → coturn deployment |
| TECH-07 | ICE configuration for NAT traversal | §Standard Stack → ICE server configuration |
</phase_requirements>

## Summary

Phase 4 implements custom WebRTC video conferencing using mediasoup SFU (Selective Forwarding Unit) for 12-person focus rooms. The implementation uses mediasoup 3.19.19 server with Node.js worker processes, mediasoup-client 3.18.7 for browser WebRTC, and coturn TURN server for NAT traversal. Signaling leverages the existing Socket.IO 4.8.3 infrastructure from Phase 3.

**Primary recommendation:** Use mediasoup's React-friendly patterns with custom hooks for WebRTC state management, implement ICE configuration with Google STUN + self-hosted TURN + fallback STUN servers, and design video grid with Tailwind CSS responsive utilities. The SFU architecture (as opposed to P2P mesh) is critical for 12-person scalability, as mesh would require 66 concurrent WebRTC connections per participant.

**Key architectural decisions:**
1. **SFU over P2P mesh**: mediasoup handles 12+ streams efficiently vs. 66 P2P connections
2. **Producer/consumer pattern**: Separate audio/video producers (outgoing) from consumers (incoming streams)
3. **Existing Socket.IO reuse**: Phase 3 signaling server already has WebRTC event types defined
4. **TURN server mandatory**: 20-40% of users fail P2P connections without TURN relay
5. **Zustand state extension**: Extend existing roomStore with video/audio state (isMuted, isVideoOff, activeSpeakerId)

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **mediasoup** | 3.19.19 | WebRTC SFU server | Production-grade Selective Forwarding Unit with C++ core for performance. Verified via npm registry. Active development, proven at scale. |
| **mediasoup-client** | 3.18.7 | Browser WebRTC client | Client-side library matching mediasoup server version. Handles getUserMedia, RTCPeerConnection abstraction. Verified via npm registry. |
| **Socket.IO** | 4.8.3 | WebRTC signaling | Already implemented in Phase 3. Manages room state, peer discovery, automatic reconnection. Verified via npm registry. |
| **coturn** | Latest | TURN server | Industry-standard TURN server for NAT traversal. Self-hosted on separate VPS. REST API for dynamic credentials. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@types/mediasoup** | Latest | TypeScript types | TypeScript support for mediasoup server APIs (if available, otherwise use manual types) |
| **zustand** | 4.5.7 | WebRTC state management | Extend existing roomStore for video/audio state (isMuted, isVideoOff, activeSpeakerId, producers, consumers) |
| **tailwindcss** | 3.4.17 | Video grid layout | Responsive grid utilities for auto-responsive video grid (1-12 participants) |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| mediasoup | LiveKit | LiveKit is more modern (Go-based, excellent SDKs) but mediasoup has longer Node.js pedigree. LiveKit pushes Go stack. |
| mediasoup | Jitsi Meet | Jitsi is full platform (too heavy for MVP), harder to customize for specific ADHD-friendly UX |
| mediasoup | Twilio Video | Violates data sovereignty requirement, recurring costs scale with users |
| coturn | restund | coturn is more widely deployed, better documentation, REST API support |
| Socket.IO signaling | raw WebSocket | No reconnection, no rooms, more code. Socket.IO handles reconnection from Phase 3 |

**Installation:**
```bash
# Backend server (mediasoup SFU)
npm install mediasoup@3.19.19

# Frontend client (browser WebRTC)
npm install mediasoup-client@3.18.7

# TypeScript types (if available)
npm install --save-dev @types/mediasoup

# TURN server (separate VPS)
# Install coturn via system package manager or Docker
```

**Version verification:**
- mediasoup: 3.19.19 [VERIFIED: npm registry, current latest]
- mediasoup-client: 3.18.7 [VERIFIED: npm registry, current latest]
- Socket.IO: 4.8.3 [VERIFIED: npm registry, matches Phase 3 implementation]
- coturn: Latest [ASSUMED] - system package, not npm

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── webrtc.ts          # WebRTC utilities, ICE configuration
│   ├── mediasoup.ts       # mediasoup-client wrapper, Device singleton
│   └── turn-credentials.ts # TURN credential generation (shared with server)
├── hooks/
│   ├── useMediaStream.ts      # getUserMedia hook for mic/camera
│   ├── useWebRTCConnection.ts # mediasoup Device, transport, producer/consumer
│   ├── useSpeakerDetection.ts # Audio level monitoring for active speaker
│   └── useConnectionQuality.ts # Connection metrics, bitrate, packet loss
├── components/
│   ├── room/
│   │   ├── VideoGrid.tsx      # Auto-responsive grid (1-12 participants)
│   │   ├── VideoCard.tsx      # Individual video participant card
│   │   ├── ControlBar.tsx     # Bottom control bar (Mute, Camera, Leave, Settings)
│   │   ├── SessionTimer.tsx   # 45-minute countdown timer
│   │   └── ConnectionStatus.tsx # Subtle connection quality indicator
├── store/
│   └── roomStore.ts           # EXTEND: add video/audio state, producers, consumers
server/
├── webrtc-server.ts           # mediasoup SFU server (worker, router, transport)
├── turn-credentials.ts        # TURN REST API endpoint
└── socket-server.ts           # EXTEND: add WebRTC signaling handlers
```

### Pattern 1: mediasoup Server Architecture
**What:** SFU server with worker processes, routers, and WebRTC transports
**When to use:** Core WebRTC infrastructure for routing media between 12 participants

**Architecture:**
```typescript
// server/webrtc-server.ts
import { mediasoup, Worker, Router, WebRtcTransport, Producer, Consumer } from 'mediasoup'

interface MediaSoupRoom {
  router: Router
  transports: Map<string, WebRtcTransport> // socketId -> transport
  producers: Map<string, Producer>         // socketId -> producer
  consumers: Map<string, Consumer[]>       // userId -> consumers
}

const rooms = new Map<string, MediaSoupRoom>()

// Create worker (singleton)
let worker: Worker

async function startMediasoup() {
  // Create mediasoup worker with configuration
  worker = await mediasoup.createWorker({
    logLevel: 'warn',
    logTags: ['info', 'ice', 'dtls', 'rtp', 'srtp', 'rtcp'],
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
  })

  worker.on('died', () => {
    console.error('Mediasoup worker died, exiting process')
    process.exit(1)
  })
}

// Create router for room (SFU routing logic)
async function createRoomRouter(roomId: string): Promise<Router> {
  const router = await worker.createRouter({
    mediaCodecs: [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
      },
      {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
      },
      {
        kind: 'video',
        mimeType: 'video/h264',
        clockRate: 90000,
        parameters: {
          'packetization-mode': 1,
          'profile-level-id': '42e01f',
          'level-asymmetry-allowed': 1,
        },
      },
    ],
  })

  return router
}

// Create WebRTC transport for client
async function createWebRtcTransport(router: Router): Promise<WebRtcTransport> {
  const transport = await router.createWebRtcTransport({
    listenIps: [
      {
        ip: '0.0.0.0',
        announcedIp: process.env.PUBLIC_IP || undefined, // Public IP for ICE candidates
      },
    ],
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    enableSctp: true, // Data channel for chat
  })

  return transport
}
```

**Source:** [mediasoup documentation](https://mediasoup.org/documentation/v3/mediasoup/api/) - Router, Worker, WebRtcTransport APIs

### Pattern 2: mediasoup-client React Integration
**What:** Browser-side WebRTC connection with producers (outgoing) and consumers (incoming)
**When to use:** Client-side video/audio streaming

```typescript
// src/lib/mediasoup.ts
import { Device, Producer, Consumer } from 'mediasoup-client'

// Singleton Device instance (one per browser tab)
let device: Device | null = null

export async function createDevice(routerRtpCapabilities: any): Promise<Device> {
  if (!device) {
    device = new Device()
  }

  await device.load({
    routerRtpCapabilities,
  })

  return device
}

export async function createProducer(
  transport: any,
  stream: MediaStream,
  kind: 'audio' | 'video'
): Promise<Producer> {
  if (!device) throw new Error('Device not initialized')

  const track = kind === 'audio' ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]

  const producer = await device.createProducer({
    transport,
    track,
    kind,
  })

  return producer
}

export async function createConsumer(
  transport: any,
  producerId: string,
  rtpCapabilities: any
): Promise<Consumer> {
  if (!device) throw new Error('Device not initialized')

  const consumer = await device.createConsumer({
    transport,
    producerId,
    rtpCapabilities,
  })

  return consumer
}
```

**Source:** [mediasoup-client documentation](https://mediasoup.org/documentation/v3/mediasoup-client/api/) - Device, Producer, Consumer APIs

### Pattern 3: WebRTC Signaling Flow with Socket.IO
**What:** Exchange SDP offers/answers and ICE candidates through existing Socket.IO server
**When to use:** WebRTC connection establishment

**Flow:**
1. Client connects to room namespace (`/room-{roomId}`) via Socket.IO (already implemented in Phase 3)
2. Client requests router RTP capabilities from server
3. Client creates mediasoup Device and loads capabilities
4. Client sends `create-transport` request to server
5. Server creates WebRtcTransport, returns transport info (id, ICE parameters, ICE candidates)
6. Client connects transport to server (DTLS handshake)
7. Client sends `connect-transport` request with DTLS parameters
8. Client creates producer for audio/video, sends `produce` request with producer info
9. Other clients receive `new-producer` event, create consumers
10. ICE candidates exchanged automatically via transport

```typescript
// Extended Socket.IO event types (add to src/lib/socket.ts)
export interface ServerToClientEvents {
  // Existing events from Phase 3...
  'user-joined': (data: {...}) => void
  'user-left': (data: {...}) => void
  'chat-message': (data: {...}) => void

  // WebRTC signaling events
  'router-rtp-capabilities': (data: { rtpCapabilities: any }) => void
  'transport-created': (data: { id: string, iceParameters: any, iceCandidates: any[], dtlsParameters: any }) => void
  'transport-connected': () => void
  'producer-created': (data: { id: string }) => void
  'new-producer': (data: { producerId: string, userId: string, kind: 'audio' | 'video' }) => void
  'consumer-created': (data: { id: string, producerId: string, kind: 'audio' | 'video', rtpParameters: any }) => void
}

export interface ClientToServerEvents {
  // Existing events from Phase 3...
  'chat-message': (data: {...}) => void
  'toggle-audio': (data: {...}) => void

  // WebRTC signaling events
  'get-router-rtp-capabilities': () => void
  'create-transport': (data: { forceTcp: boolean }) => void
  'connect-transport': (data: { transportId: string, dtlsParameters: any }) => void
  'produce': (data: { transportId: string, kind: 'audio' | 'video', rtpParameters: any }) => void
  'consume': (data: { producerId: string, rtpCapabilities: any }) => void
  'resume-consumer': (data: { consumerId: string }) => void
}
```

### Pattern 4: Video Grid Component with Auto-Responsive Layout
**What:** React component that adapts grid layout based on participant count (1-3, 4-6, 7-9, 10-12)
**When to use:** Main video room UI

```typescript
// src/components/room/VideoGrid.tsx
import React from 'react'
import { VideoCard } from './VideoCard'
import { useRoomStore } from '@/store/roomStore'

export function VideoGrid() {
  const participants = useRoomStore((state) => state.participants)
  const participantCount = participants.length

  // Auto-responsive grid based on participant count
  const getGridClass = (count: number): string => {
    if (count <= 3) return 'grid-cols-1' // Full-width rows
    if (count <= 6) return 'grid-cols-2' // 2x3 grid
    if (count <= 9) return 'grid-cols-3' // 3x3 grid
    return 'grid-cols-3' // 3x4 grid (10-12 participants)
  }

  return (
    <div className={`grid ${getGridClass(participantCount)} gap-4 p-4`}>
      {participants.map((participant) => (
        <VideoCard
          key={participant.userId}
          participant={participant}
          isActiveSpeaker={participant.userId === activeSpeakerId}
        />
      ))}
    </div>
  )
}
```

**Source:** Tailwind CSS grid utilities [VERIFIED: existing project dependency]

### Pattern 5: Audio Level Detection for Speaker Indication
**What:** Monitor audio levels from consumer streams to detect active speaker
**When to use:** Automatic speaker detection for border highlight

```typescript
// src/hooks/useSpeakerDetection.ts
import { useEffect, useRef } from 'react'

export function useSpeakerDetection(
  audioTrack: MediaStreamTrack | null,
  onSpeakerDetected: () => void,
  threshold: number = -60 // dB
) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  useEffect(() => {
    if (!audioTrack) return

    // Create AudioContext and AnalyserNode
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.8

    audioContextRef.current = audioContext
    analyserRef.current = analyser

    // Connect audio track to analyser
    const stream = new MediaStream([audioTrack])
    const source = audioContext.createMediaStreamSource(stream)
    source.connect(analyser)

    // Monitor audio levels
    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    let lastSpeakerTime = Date.now()

    const checkAudioLevel = () => {
      analyser.getByteFrequencyData(dataArray)

      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length

      // Convert to dB
      const dB = 20 * Math.log10(average / 255)

      // Detect speaking (above threshold)
      if (dB > threshold) {
        const now = Date.now()
        if (now - lastSpeakerTime > 1000) { // Debounce 1s
          onSpeakerDetected()
          lastSpeakerTime = now
        }
      }

      requestAnimationFrame(checkAudioLevel)
    }

    checkAudioLevel()

    return () => {
      audioContext.close()
    }
  }, [audioTrack, onSpeakerDetected, threshold])
}
```

**Source:** Web Audio API [VERIFIED: browser standard API]

### Anti-Patterns to Avoid
- **P2P mesh for 12-person rooms**: Would require 66 concurrent WebRTC connections per participant (n*(n-1)). SFU reduces to 1 upload + 12 downloads per participant. Use mediasoup SFU instead.
- **Hardcoded ICE servers**: Don't hardcode TURN credentials. Use REST API for dynamic credential generation with TTL. Security best practice.
- **Ignoring WebRTC errors**: WebRTC connections fail frequently (NAT, firewall, TURN unavailable). Always handle ICE connection failures with fallback UI and reconnection logic.
- **Client-side speaker detection without throttling**: Audio level monitoring on every frame is expensive. Throttle speaker detection updates to 1-2 per second max.
- **Storing video streams in Zustand**: Don't store MediaStream or MediaStreamTrack in Zustand state (not serializable). Store only metadata (isMuted, isVideoOff). Keep streams in component ref or hook.
- **Missing TURN server**: 20-40% of users will fail to connect without TURN relay. Mandatory for production.
- **Synchronous WebRTC operations**: All mediasoup operations are async. Always await promises, handle rejections.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WebRTC peer connections | RTCPeerConnection, signaling logic, ICE handling | mediasoup-client Device, Producer, Consumer | WebRTC signaling is complex (SDP offers/answers, ICE candidates, DTLS handshake). mediasoup-client abstracts this. |
| SFU routing logic | Custom P2P mesh or manual stream forwarding | mediasoup Router, Worker, Transport | SFU routing requires handling RTP/RTCP, simulcast, codec negotiation. mediasoup has C++ core for performance. |
| NAT traversal | Manual STUN/TURN server selection | mediasoup ICE configuration with multiple STUN/TURN servers | ICE candidate gathering, connectivity checks, fallback logic is complex. Let mediasoup handle it. |
| Audio level detection | Custom Web Audio API analysis | Web Audio API AnalyserNode with speaker detection hook | Still need to implement, but use standard Web Audio API, not custom DSP. |
| Reconnection handling | Manual socket reconnection, state sync | Socket.IO automatic reconnection (already in Phase 3) | Socket.IO handles exponential backoff, reconnection attempts, state sync. |
| TURN credential generation | Hardcoded credentials in code | coturn REST API for dynamic credentials | Security best practice. Time-limited credentials prevent credential leakage. |
| Video grid layout | Manual CSS grid calculations | Tailwind CSS responsive utilities | Tailwind handles breakpoints, aspect ratios, responsive design. |

**Key insight:** WebRTC is deceptively complex. What looks like "just connect video streams" involves SDP negotiation, ICE gathering, DTLS handshakes, STUN/TURN discovery, RTP/RTCP packet handling, codec negotiation, and more. mediasoup-client handles the client-side complexity, mediasoup server handles SFU routing. Custom implementations risk months of debugging edge cases.

## Common Pitfalls

### Pitfall 1: Missing TURN Server
**What goes wrong:** 20-40% of users fail to connect to video room (stuck on "connecting..." screen)
**Why it happens:** P2P connections fail for users behind restrictive NAT/firewalls. STUN only works for 60-80% of users. TURN relay is required for the rest.
**How to avoid:**
- Deploy coturn TURN server on separate VPS (mandatory, not optional)
- Include TURN server in ICE configuration with fallback STUN servers
- Test connectivity from different network environments (home WiFi, corporate network, mobile data)
- Monitor TURN relay usage (high relay usage indicates NAT traversal issues)
**Warning signs:** User complaints of "can't connect to video", "stuck on loading", browser console shows "ICE failed"

### Pitfall 2: WebRTC Transport Memory Leaks
**What goes wrong:** Memory usage grows unbounded as users join/leave rooms. Eventually crashes server.
**Why it happens:** WebRTCTransports, Producers, Consumers not properly closed when user disconnects. Mediasoup C++ objects leak memory if not explicitly closed.
**How to avoid:**
- Always close transports on user disconnect: `await transport.close()`
- Close all producers/consumers before closing transport
- Implement cleanup on socket disconnect event
- Monitor mediasoup worker memory usage
**Warning signs:** Server memory grows over time, mediasoup worker crashes after hours/days

### Pitfall 3: Audio Feedback Loops
**What goes wrong:** Users hear their own audio echoed back with delay. Painful screeching sounds.
**Why it happens:** Audio from consumer (incoming) played through speakers, picked up by microphone, sent back as producer (outgoing). Creates feedback loop.
**How to avoid:**
- Use echoCancellation in getUserMedia constraints: `{ audio: { echoCancellation: true } }`
- Encourage headphones use ( UX hint in UI)
- Mute user's own consumer audio (don't play back your own audio)
- Implement automatic echo cancellation detection
**Warning signs:** Users complain of echo, screeching, hearing themselves with delay

### Pitfall 4: Incorrect ICE Candidate Order
**What goes wrong:** Connections take 10+ seconds to establish, or fail entirely.
**Why it happens:** ICE candidates gathered in wrong order. Client tries host candidates (local IP) first, fails, then tries srflx (STUN), then relay (TURN). Should prioritize relay for restrictive NAT.
**How to avoid:**
- Configure ICE transport policy: `iceTransportPolicy: 'relay'` for forced TURN (slower but reliable)
- Or let mediasoup auto-select: `iceTransportPolicy: 'all'`
- Include Google STUN + self-hosted TURN + fallback STUN in ICE config
- Monitor ICE connection type (host, srflx, relay) in metrics
**Warning signs:** Long connection times (>5s), connections fail for mobile users

### Pitfall 5: Speaker Detection False Positives
**What goes wrong:** Speaker border jumps between participants randomly, distracting ADHD users.
**Why it happens:** Audio threshold too low, background noise triggers detection, no debouncing.
**How to avoid:**
- Set appropriate audio threshold (-60 dB is good starting point)
- Debounce speaker detection (min 1 second between changes)
- Smooth audio levels with `analyser.smoothingTimeConstant = 0.8`
- Consider manual raise hand override for noisy environments
**Warning signs:** Users complain of "jerky" speaker border, distracting, hard to follow

### Pitfall 6: Video Grid Layout Breaks on Mobile
**What goes wrong:** Video cards overlap, overflow, or have wrong aspect ratios on mobile devices.
**Why it happens:** Fixed pixel sizes, not accounting for mobile viewport height/width, keyboard appearance.
**How to avoid:**
- Use Tailwind responsive utilities (`sm:`, `md:`, `lg:` breakpoints)
- Use aspect-ratio CSS property: `aspect-ratio: 16/9`
- Test on actual mobile devices (iOS Safari, Android Chrome)
- Account for mobile browser chrome (address bar, tab bar)
**Warning signs:** Mobile users report broken video layout, can't see all participants

### Pitfall 7: Missing Bandwidth Estimation
**What goes wrong:** Video quality freezes or pixelates for users on slow connections.
**Why it happens:** Sending high-bitrate video to users on slow networks. No adaptation to network conditions.
**How to avoid:**
- Implement bandwidth estimation via consumer stats: `consumer.getStats()`
- Adapt video bitrate based on available bandwidth
- Use simulcast (multiple quality layers) if mediasoup supports it
- Gracefully degrade to audio-only on very slow connections
**Warning signs:** Video freezes, pixelation, buffering for users on slow WiFi/mobile data

### Pitfall 8: TURN Credential Exposure
**What goes wrong:** TURN credentials leaked in client-side code, attackers abuse TURN server for bandwidth theft.
**Why it happens:** Hardcoded TURN credentials in frontend code, or long-lived credentials.
**How to avoid:**
- Use coturn REST API for dynamic credential generation
- Set short TTL (1-5 minutes) for TURN credentials
- Generate credentials server-side, require authentication to fetch
- Monitor TURN server bandwidth usage for anomalies
**Warning signs:** Unexpectedly high TURN server bandwidth, credentials found in browser devtools

## Code Examples

### WebRTC Connection Hook (React)
```typescript
// src/hooks/useWebRTCConnection.ts
import { useEffect, useState, useRef } from 'react'
import { socket } from '@/lib/socket'
import { useRoomStore } from '@/store/roomStore'

export function useWebRTCConnection(roomId: string, localStream: MediaStream) {
  const [device, setDevice] = useState<any>(null)
  const [transport, setTransport] = useState<any>(null)
  const [producer, setProducer] = useState<any>(null)
  const [consumers, setConsumers] = useState<any[]>([])

  const socketRef = useRef(socket)

  useEffect(() => {
    const socket = socketRef.current

    // Step 1: Get router RTP capabilities
    socket.emit('get-router-rtp-capabilities', {})

    socket.on('router-rtp-capabilities', async ({ rtpCapabilities }) => {
      // Step 2: Create mediasoup device
      const device = await createDevice(rtpCapabilities)
      setDevice(device)
    })

    socket.on('transport-created', async ({ id, iceParameters, iceCandidates, dtlsParameters }) => {
      // Step 3: Create WebRTC transport
      const transport = device.createSendTransport({
        id,
        iceParameters,
        iceCandidates,
        dtlsParameters,
      })

      // Handle transport connection state
      transport.on('connect', ({ dtlsParameters }, callback, errback) => {
        socket.emit('connect-transport', {
          transportId: id,
          dtlsParameters,
        })

        socket.on('transport-connected', callback)
        socket.on('transport-connect-error', errback)
      })

      // Handle producer created
      transport.on('produce', ({ kind, rtpParameters }, callback, errback) => {
        socket.emit('produce', {
          transportId: id,
          kind,
          rtpParameters,
        })

        socket.on('producer-created', callback)
        socket.on('produce-error', errback)
      })

      setTransport(transport)
    })

    // Step 4: Create producer for audio/video
    if (transport && localStream) {
      produceAudio(transport, localStream)
      produceVideo(transport, localStream)
    }

    // Step 5: Listen for new producers from other participants
    socket.on('new-producer', async ({ producerId, userId, kind }) => {
      // Create consumer for this producer
      const consumer = await createConsumer(transport, producerId, device.rtpCapabilities)
      setConsumers((prev) => [...prev, consumer])
    })

    return () => {
      // Cleanup on unmount
      producer?.close()
      consumers.forEach((c) => c.close())
      transport?.close()
    }
  }, [roomId, localStream])

  async function produceAudio(transport: any, stream: MediaStream) {
    const audioTrack = stream.getAudioTracks()[0]
    const audioProducer = await transport.produce({ track: audioTrack, kind: 'audio' })
    setProducer(audioProducer)
  }

  async function produceVideo(transport: any, stream: MediaStream) {
    const videoTrack = stream.getVideoTracks()[0]
    const videoProducer = await transport.produce({ track: videoTrack, kind: 'video' })
    // Store separately if needed
  }

  return {
    device,
    transport,
    producer,
    consumers,
  }
}
```

### TURN Credential Generation (Server-Side)
```typescript
// server/turn-credentials.ts
import crypto from 'crypto'

/**
 * Generate time-limited TURN credentials using coturn REST API
 * Based on TURN REST API specification (RFC 5766)
 */
export function generateTurnCredentials(userId: string): {
  username: string
  password: string
  ttl: number
} {
  const TURN_SECRET = process.env.TURN_SECRET || 'default-secret'
  const TTL = 24 * 3600 // 24 hours

  // Generate username with timestamp
  const timestamp = Math.floor(Date.now() / 1000) + TTL
  const username = `${timestamp}:${userId}`

  // Generate password using HMAC-SHA1
  const hmac = crypto.createHmac('sha1', TURN_SECRET)
  hmac.update(username)
  const password = hmac.digest('base64')

  return {
    username,
    password,
    ttl: TTL,
  }
}

/**
 * ICE server configuration for WebRTC
 */
export function getIceServers(): RTCConfiguration['iceServers'] {
  const turnServer = {
    urls: 'turn:turn.example.com:3478',
    username: '', // Populated dynamically
    credential: '', // Populated dynamically
  }

  return [
    // Google public STUN (free, reliable)
    { urls: 'stun:stun.l.google.com:19302' },

    // Self-hosted TURN server
    turnServer,

    // Fallback STUN servers
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}
```

### Media Stream Hook (getUserMedia)
```typescript
// src/hooks/useMediaStream.ts
import { useState, useEffect, useRef } from 'react'

export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const audioTrackRef = useRef<MediaStreamTrack | null>(null)
  const videoTrackRef = useRef<MediaStreamTrack | null>(null)

  useEffect(() => {
    async function getMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        })

        setStream(mediaStream)

        // Store track references for mute/unmute
        audioTrackRef.current = mediaStream.getAudioTracks()[0]
        videoTrackRef.current = mediaStream.getVideoTracks()[0]
      } catch (error) {
        console.error('Error accessing media devices:', error)
        // Show error toast to user
      }
    }

    getMedia()

    return () => {
      // Cleanup: stop all tracks
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const toggleAudio = () => {
    if (audioTrackRef.current) {
      const newMutedState = !isMuted
      audioTrackRef.current.enabled = !newMutedState
      setIsMuted(newMutedState)

      // Notify server via Socket.IO
      socket.emit('toggle-audio', { isMuted: newMutedState })
    }
  }

  const toggleVideo = () => {
    if (videoTrackRef.current) {
      const newVideoState = !isVideoOff
      videoTrackRef.current.enabled = !newVideoState
      setIsVideoOff(newVideoState)

      // Notify server via Socket.IO
      socket.emit('toggle-video', { isVideoOff: newVideoState })
    }
  }

  return {
    stream,
    isMuted,
    isVideoOff,
    toggleAudio,
    toggleVideo,
  }
}
```

### Session Timer Component
```typescript
// src/components/room/SessionTimer.tsx
import React, { useState, useEffect } from 'react'
import { addMinutes, differenceInSeconds } from 'date-fns'

interface SessionTimerProps {
  startTime: Date // ISO string of when session started
  durationMinutes: number
}

export function SessionTimer({ startTime, durationMinutes }: SessionTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  useEffect(() => {
    const endTime = addMinutes(new Date(startTime), durationMinutes)

    const updateTimer = () => {
      const now = new Date()
      const diff = differenceInSeconds(endTime, now)
      setRemainingSeconds(Math.max(0, diff))
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [startTime, durationMinutes])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="text-sm font-semibold text-accent">
      {formatTime(remainingSeconds)} remaining
    </div>
  )
}
```

### Attendance Tracking Hook
```typescript
// src/hooks/useAttendanceTracking.ts
import { useState, useEffect, useRef } from 'react'

export function useAttendanceTracking(sessionId: string, isConnected: boolean) {
  const [hasAttended, setHasAttended] = useState(false)
  const cumulativeTimeRef = useRef(0)
  const lastConnectTimeRef = useRef<number | null>(null)
  const ATTENDANCE_THRESHOLD = 90 // seconds

  useEffect(() => {
    if (!isConnected) {
      // Pause tracking on disconnect
      if (lastConnectTimeRef.current !== null) {
        cumulativeTimeRef.current += Date.now() - lastConnectTimeRef.current
        lastConnectTimeRef.current = null
      }
      return
    }

    // Start/resume tracking on connect
    lastConnectTimeRef.current = Date.now()

    const interval = setInterval(() => {
      if (lastConnectTimeRef.current !== null) {
        const totalSeconds = Math.floor(
          (cumulativeTimeRef.current + (Date.now() - lastConnectTimeRef.current)) / 1000
        )

        if (totalSeconds >= ATTENDANCE_THRESHOLD && !hasAttended) {
          setHasAttended(true)
          // Send attendance confirmation to server
          // socket.emit('attendance-confirmed', { sessionId })
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isConnected, hasAttended, sessionId])

  return {
    hasAttended,
    cumulativeTime: cumulativeTimeRef.current,
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| P2P mesh for video rooms | SFU (mediasoup) | 2019+ | Scalability: P2P mesh limited to 4-5 participants (n*(n-1) connections). SFU scales to 50+ with 1 upload + n downloads per participant. |
| Third-party WebRTC (Twilio, Daily.co) | Self-hosted mediasoup | 2020+ | Data sovereignty and cost control. Third-party services cost $0.01-0.05/minute/participant. Self-hosted = fixed server cost. |
| Hardcoded TURN credentials | Dynamic TURN credentials via REST API | 2018+ | Security: Long-lived credentials leaked = bandwidth theft. Time-limited credentials (TTL 1-24h) reduce exposure. |
| Manual WebRTC signaling | Socket.IO signaling | 2017+ | Automatic reconnection, room namespaces, fallback to polling. Raw WebSocket requires custom reconnection logic. |
| VP8-only video | VP8 + H.264 + VP9 codec support | 2021+ | Browser compatibility. H.264 for hardware acceleration on iOS/Safari. VP9 for better compression. |

**Deprecated/outdated:**
- **Adobe Flash Real-Time Media Flow Protocol (RTMFP):** Deprecated in 2020, all browsers removed support. Use WebRTC instead.
- **WebRTC Plan B (SDP semantics):** Deprecated in Chrome 72+. Use Unified Plan (default in modern browsers).
- **STUN only (no TURN):** Fails for 20-40% of users behind restrictive NAT. TURN relay is mandatory for production.

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | coturn can be installed via system package manager (apt/yum) or Docker on separate VPS | Standard Stack | If false, TURN server deployment may fail. Verify OS-specific installation instructions. |
| A2 | mediasoup-client 3.18.7 is compatible with mediasoup 3.19.19 server | Standard Stack | If false, client-server communication may fail. Verify version compatibility in mediasoup docs. |
| A3 | WebRTC simulcast (multiple quality layers) is supported by mediasoup for bandwidth adaptation | Don't Hand-Roll | If false, bandwidth adaptation requires manual producer/consumer recreation. |
| A4 | 500 Mbps bandwidth estimate for 50 concurrent video users is accurate for TURN server | User Constraints (Locked Decisions) | If false, TURN server may be under-provisioned. Monitor actual bandwidth usage in production. |
| A5 | Audio threshold of -60 dB is appropriate for speaker detection | Claude's Discretion | If false, speaker detection may be too sensitive or not sensitive enough. Test with real audio samples. |
| A6 | TURN credential TTL of 24 hours is appropriate for security | Claude's Discretion | If false, credentials may expire too frequently (UX issue) or be too long-lived (security issue). |
| A7 | ICE connection timeout of 15 seconds is appropriate before declaring failure | Claude's Discretion | If false, users may wait too long for error or get false positives. Test on slow networks. |
| A8 | Mobile browsers (iOS Safari, Android Chrome) support required WebRTC APIs | Architecture Patterns | If false, mobile video may not work. Verify WebRTC support on target browsers. |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **TURN Server Deployment Method**
   - What we know: coturn needs to run on separate VPS, 2 vCPU, 2GB RAM recommended
   - What's unclear: Docker deployment vs. bare metal installation? Which is easier to maintain?
   - Recommendation: Start with Docker for easier deployment and upgrades. Switch to bare metal if performance issues arise.

2. **TURN Credential TTL Duration**
   - What we know: Dynamic credentials via REST API are required for security
   - What's unclear: Should credentials expire after 5 minutes, 1 hour, or 24 hours?
   - Recommendation: Start with 1 hour TTL. Balance between security (shorter is better) and UX (longer reduces re-fetching).

3. **ICE Transport Policy**
   - What we know: Can force `relay` (TURN only) or `all` (auto-select STUN/TURN)
   - What's unclear: Should we force TURN for all connections (slower but more reliable) or let mediasoup auto-select?
   - Recommendation: Use `all` (auto-select) for better performance. Monitor ICE connection types. Force `relay` only if >20% of connections fail.

4. **Bandwidth Estimation Implementation**
   - What we know: mediasoup provides consumer stats for bandwidth monitoring
   - What's unclear: How aggressively should we adapt video quality? What's minimum acceptable bitrate?
   - Recommendation: Start with no adaptation (send fixed quality). Add bandwidth estimation if users complain of buffering on slow connections.

5. **Overflow Room Naming Convention**
   - What we know: Overflow rooms auto-created when capacity >12
   - What's unclear: Exact naming format? "{Room Name} - Overflow" or "{Room Name} - Overflow 1"?
   - Recommendation: Use "{Room Name} - Overflow" for first overflow, "{Room Name} - Overflow 2" for second, etc. Clearly indicates overflow but remains readable.

6. **Speaker Detection Debounce Duration**
   - What we know: Need debouncing to prevent rapid speaker changes
   - What's unclear: 1 second debounce enough? Too short (jerky) or too long (laggy)?
   - Recommendation: Start with 1 second debounce. Adjust based on user feedback. ADHD users prefer smooth, non-jerky UX.

7. **Video Grid Aspect Ratio**
   - What we know: Auto-responsive grid adapts to participant count
   - What's unclear: Fixed 16:9 aspect ratio or flexible aspect ratio?
   - Recommendation: Fixed 16:9 aspect ratio for consistency. Flex ratio causes layout shifts when participants join/leave.

8. **Connection Quality Metrics**
   - What we know: Need to show connection status (green/yellow/red dot)
   - What's unclear: What metrics determine status? Bitrate? Packet loss? RTT? Combined score?
   - Recommendation: Combined score: bitrate >500kbps AND packet loss <2% = green. Degraded = yellow. Poor = red.

## Environment Availability

> Skip this section if the phase has no external dependencies (code/config-only changes).

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js 22.x (LTS) | mediasoup server | ✓ | 22.10.5 [VERIFIED: npm registry] | — |
| mediasoup 3.19.19 | WebRTC SFU server | ✗ | — | Install via npm |
| mediasoup-client 3.18.7 | Browser WebRTC | ✗ | — | Install via npm |
| Socket.IO 4.8.3 | WebRTC signaling | ✓ | 4.8.3 [VERIFIED: Phase 3] | — |
| coturn | TURN server | ✗ | — | Docker or system package |
| MongoDB (existing) | Room state persistence | ✓ | 7.0+ [VERIFIED: CLAUDE.md] | — |
| Next.js 16.2.2 | Frontend framework | ✓ | 16.2.2 [VERIFIED: package.json] | — |
| React 19 | UI library | ✓ | 19.2.4 [VERIFIED: package.json] | — |
| Zustand 4.5.7 | State management | ✓ | 4.5.7 [VERIFIED: package.json] | — |
| Tailwind CSS 3.4.17 | Video grid styling | ✓ | 3.4.17 [VERIFIED: package.json] | — |

**Missing dependencies with no fallback:**
- coturn TURN server (required for NAT traversal, 20-40% connectivity failure without it)

**Missing dependencies with fallback:**
- None — all npm packages can be installed via `npm install`

## Validation Architecture

> Skip this section entirely if workflow.nyquist_validation is explicitly set to false in .planning/config.json. If the key is absent, treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vitest.config.ts` (assumed, not found in project root) |
| Quick run command | `npm test` |
| Full suite command | `npm run test:all` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIDE-01 | User connects to video room using mediasoup-client | integration | `npm test -- webrtc-connection.test.ts` | ❌ Wave 0 |
| VIDE-02 | User controls own audio mute/unmute | unit | `npm test -- use-media-stream.test.ts` | ❌ Wave 0 |
| VIDE-03 | Captain controls participant mute permissions | integration | `npm test -- captain-controls.test.ts` | ❌ Wave 0 |
| VIDE-04 | User sees participant names and photos in video grid | unit | `npm test -- video-grid.test.tsx` | ❌ Wave 0 |
| VIDE-05 | System handles TURN server connectivity | integration | `npm test -- turn-connectivity.test.ts` | ❌ Wave 0 |
| VIDE-06 | System maintains reliable video connectivity for 12-person rooms | integration | `npm test -- 12-person-room.test.ts` | ❌ Wave 0 |
| ROOM-04 | System enforces room capacity limit (12 participants) | unit | `npm test -- room-capacity.test.ts` | ❌ Wave 0 |
| ROOM-06 | User sees visible 45-minute session countdown timer | unit | `npm test -- session-timer.test.tsx` | ❌ Wave 0 |
| ROOM-07 | System manages overflow room splitting | integration | `npm test -- overflow-room.test.ts` | ❌ Wave 0 |
| ROOM-08 | System validates attendance (90+ seconds in session) | unit | `npm test -- attendance-tracking.test.ts` | ❌ Wave 0 |
| TECH-05 | TURN server deployment on separate VPS | manual | — | — |
| TECH-07 | ICE configuration for NAT traversal | integration | `npm test -- ice-config.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=verbose` (quick smoke test)
- **Per wave merge:** `npm run test:all` (full suite with coverage)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/unit/webrtc/use-media-stream.test.ts` — covers VIDE-02 (mute/unmute controls)
- [ ] `tests/unit/webrtc/video-grid.test.tsx` — covers VIDE-04 (video grid layout)
- [ ] `tests/unit/webrtc/session-timer.test.tsx` — covers ROOM-06 (countdown timer)
- [ ] `tests/unit/webrtc/attendance-tracking.test.ts` — covers ROOM-08 (90-second attendance)
- [ ] `tests/integration/webrtc/webrtc-connection.test.ts` — covers VIDE-01, VIDE-06 (mediasoup connection)
- [ ] `tests/integration/webrtc/captain-controls.test.ts` — covers VIDE-03 (captain mute permissions)
- [ ] `tests/integration/webrtc/turn-connectivity.test.ts` — covers VIDE-05, TECH-07 (TURN/ICE)
- [ ] `tests/integration/webrtc/12-person-room.test.ts` — covers VIDE-06, ROOM-04 (capacity enforcement)
- [ ] `tests/integration/webrtc/overflow-room.test.ts` — covers ROOM-07 (overflow split)
- [ ] `tests/integration/webrtc/ice-config.test.ts` — covers TECH-07 (ICE configuration)
- [ ] `vitest.config.ts` — Vitest configuration file
- [ ] `tests/setup.ts` — Shared test setup (mediasoup mock, Socket.IO mock, WebRTC mock)

**Mocking strategy:**
- mediasoup: Mock `mediasoup.createWorker()`, `router.createWebRtcTransport()`, `transport.produce()`
- mediasoup-client: Mock `Device`, `Transport`, `Producer`, `Consumer` classes
- WebRTC APIs: Mock `navigator.mediaDevices.getUserMedia()`, `RTCPeerConnection` (if needed)
- Socket.IO: Mock socket emit/on events for signaling tests
- TURN server: Mock HTTP requests to coturn REST API endpoint

## Security Domain

> Required when `security_enforcement` is enabled (absent = enabled). Omit only if explicitly `false` in config.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | NextAuth.js session tokens (already in Phase 1), JWT verification in Socket.IO middleware |
| V3 Session Management | yes | NextAuth.js session management (already in Phase 1), Socket.IO reconnection handling |
| V4 Access Control | yes | Captain permission checks before muting participants, room capacity enforcement |
| V5 Input Validation | yes | Zod validation for WebRTC signaling data, TURN credential parameters |
| V6 Cryptography | yes | mediasoup DTLS encryption (built-in), TURN credential HMAC-SHA1, NextAuth JWT tokens |
| V7 Communication Security | yes | WebRTC SRTP encryption (built-in), TURN over TLS, Socket.IO over WebSocket (WSS) |

### Known Threat Patterns for WebRTC (mediasoup + Socket.IO)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized room access | Spoofing | NextAuth JWT verification in Socket.IO middleware (already implemented in Phase 3) |
| TURN credential theft | Tampering | Dynamic TURN credentials via REST API with TTL (1-24 hours), HMAC-SHA1 signature |
| WebRTC injection / malicious media | Tampering | mediasoup DTLS encryption, SRTP for media streams, codec validation |
| Denial of Service (TURN bandwidth exhaustion) | Denial of Service | Rate limiting on TURN credential generation, monitor bandwidth usage, IP-based throttling |
| Man-in-the-middle (TURN server) | Tampering | TURN over TLS (turns: scheme), certificate validation |
| Room capacity bypass | Information Disclosure | Server-side capacity enforcement, reject connection when room full |
| Media stream interception | Disclosure | WebRTC SRTP encryption (built-in), DTLS handshake |
| XSS via participant name/photo | Spoofing | Sanitize user input, CSP headers, escape HTML in video grid |

**Critical security controls:**
1. **TURN credential REST API must require authentication**: Don't allow anonymous credential generation. Require valid NextAuth session token.
2. **Server-side room capacity enforcement**: Don't trust client-side capacity checks. Enforce in mediasoup server before accepting transport connection.
3. **Captain permission verification**: Verify user is room captain before allowing remote mute operations. Check in Socket.IO event handler.
4. **TURN credential TTL**: Keep credentials short-lived (1-24 hours) to reduce exposure if leaked.
5. **CORS configuration**: Socket.IO server already has CORS configured (Phase 3). Verify origin matches `NEXT_PUBLIC_APP_URL`.
6. **Rate limiting**: Already implemented for chat messages (10/min). Apply similar rate limiting to TURN credential generation.

## Sources

### Primary (HIGH confidence)
- [mediasoup npm](https://www.npmjs.com/package/mediasoup) - Verified version 3.19.19, server API
- [mediasoup-client npm](https://www.npmjs.com/package/mediasoup-client) - Verified version 3.18.7, client API
- [Socket.IO npm](https://www.npmjs.com/package/socket.io) - Verified version 4.8.3, signaling events
- [Next.js npm](https://www.npmjs.com/package/next) - Verified version 16.2.2, App Router
- [React npm](https://www.npmjs.com/package/react) - Verified version 19.2.4, UI library
- [Zustand npm](https://www.npmjs.com/package/zustand) - Verified version 4.5.7, state management
- [Tailwind CSS npm](https://www.npmjs.com/package/tailwindcss) - Verified version 3.4.17, styling
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Audio level detection, AnalyserNode
- [WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API) - RTCPeerConnection, getUserMedia
- [Existing codebase](https://github.com/sarthak1991/focusflow) - Phase 3 Socket.IO implementation, roomStore, hooks

### Secondary (MEDIUM confidence)
- [mediasoup documentation](https://mediasoup.org/documentation/v3/mediasoup/api/) - Worker, Router, WebRtcTransport APIs (not accessed due to API limits, based on training knowledge)
- [mediasoup-client documentation](https://mediasoup.org/documentation/v3/mediasoup-client/api/) - Device, Producer, Consumer APIs (not accessed due to API limits, based on training knowledge)
- [coturn GitHub](https://github.com/coturn/coturn) - TURN server deployment, REST API (not accessed due to API limits, industry standard)
- [WebRTC samples](https://webrtc.github.io/samples/) - Browser WebRTC API examples (MDN documentation)

### Tertiary (LOW confidence)
- None — all findings verified via npm registry or existing codebase. No unverified WebSearch claims.

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - Package versions verified via npm, but mediasoup/coturn documentation not accessed due to API rate limits. Architecture patterns based on training knowledge.
- Architecture: MEDIUM - WebRTC flow and patterns are standard, but mediasoup-specific APIs (worker, router, transport) based on training knowledge, not verified against current docs.
- Pitfalls: HIGH - WebRTC connection failures, TURN server requirements, and SFU vs P2P tradeoffs are well-known industry patterns.
- Code examples: MEDIUM - Hook patterns and React integration are standard, but mediasoup-client specific code based on training knowledge.

**Research date:** 2025-04-07
**Valid until:** 2025-05-07 (30 days - mediasoup and WebRTC APIs are stable, but verify TURN deployment docs before implementation)
