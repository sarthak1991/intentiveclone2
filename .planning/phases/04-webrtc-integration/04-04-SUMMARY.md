---
phase: 04-webrtc-integration
plan: 04
title: Producer/Consumer Implementation
subsystem: WebRTC Client
tags: [webrtc, mediasoup, producer, consumer, speaker-detection, connection-quality]

# Dependency Graph
requires:
  - phase: 04-webrtc-integration
    plan: 03
provides:
  - component: useWebRTCConnection
    usage: WebRTC producer/consumer logic with mediasoup-client
  - component: useSpeakerDetection
    usage: Audio level monitoring for active speaker detection
  - component: useConnectionQuality
    usage: Connection quality metrics (bitrate, packet loss, connection type)
  - component: roomStore
    usage: Extended state management for WebRTC (isMuted, isVideoOff, activeSpeakerId)

# Tech Stack
added:
  - library: mediasoup-client
    version: 3.18.7
    purpose: WebRTC client for browser (Device, Producer, Consumer)
  - pattern: Web Audio API
    purpose: Audio level monitoring with AudioContext and AnalyserNode
patterns:
  - Producer pattern: Outgoing media streams (audio/video) to SFU
  - Consumer pattern: Incoming media streams from SFU
  - Socket.IO signaling: WebRTC SDP/ICE exchange via existing socket infrastructure
  - Reactive state management: Zustand store with Map data structures

# Key Files Created/Modified
created:
  - path: src/hooks/useWebRTCConnection.ts
    lines: 546
    purpose: Complete producer/consumer logic with mediasoup-client
  - path: src/hooks/useSpeakerDetection.ts
    lines: 189
    purpose: Audio level monitoring for active speaker detection
  - path: src/hooks/useConnectionQuality.ts
    lines: 270
    purpose: Connection quality metrics (bitrate, packet loss, connection type)
modified:
  - path: src/store/roomStore.ts
    lines: 165
    purpose: Extended with WebRTC state (isMuted, isVideoOff, activeSpeakerId, producers, consumers)

# Decisions Made

## D-01: Producer/Consumer Separation
**Decision:** Use separate producer (outgoing) and consumer (incoming) objects for audio/video streams.
**Rationale:** mediasoup-client architecture requires separate handling. Producers send local tracks to SFU. Consumers receive remote tracks from SFU.
**Impact:** Clean separation of concerns. Allows independent control of outgoing vs. incoming media.

## D-02: Store Metadata, Not MediaStreams
**Decision:** Store only metadata in Zustand (isMuted, isVideoOff, activeSpeakerId), not MediaStream or MediaStreamTrack objects.
**Rationale:** Zustand requires serializable state. MediaStreamTracks are not serializable and would break state persistence.
**Impact:** WebRTC streams managed in component refs/hooks. Only UI state stored in Zustand.

## D-03: Speaker Detection Debouncing
**Decision:** Debounce speaker detection to 1 second minimum between updates.
**Rationale:** Prevents rapid switching between speakers (distracting for ADHD users per D-01/D-03).
**Impact:** Smoother UX, less distraction, but slight delay in speaker transitions.

## D-04: Connection Quality Polling Interval
**Decision:** Poll consumer stats every 5 seconds (configurable).
**Rationale:** Balances real-time monitoring with performance overhead. 5 seconds is standard for WebRTC stats.
**Impact:** Near real-time quality updates without excessive CPU usage.

## D-05: Quality Level Thresholds
**Decision:** Define quality levels as:
- Good: >500kbps bitrate AND <2% packet loss
- Degraded: 100-500kbps bitrate OR 2-10% packet loss
- Poor: <100kbps bitrate OR >10% packet loss
**Rationale:** Based on WebRTC best practices. 500kbps is minimum for acceptable video quality. 2% packet loss is acceptable threshold.
**Impact:** Clear visual feedback for connection issues. Helps users troubleshoot problems.

## Deviations from Plan

### None - plan executed exactly as written

All 6 tasks completed as specified. No bugs, missing functionality, or blocking issues discovered.

# Threat Flags

| Flag | File | Description |
|------|------|-------------|
| **mitigate** | src/hooks/useSpeakerDetection.ts | T-04-17: Audio processing exhaustion - Limited polling to 60fps max, debounced to 1 update/second |
| **mitigate** | src/hooks/useWebRTCConnection.ts | T-04-18: Local audio leakage - Filter own producers (don't consume own audio/video) |

# Known Stubs

**None** - All functionality is complete and wired. Speaker detection integration is documented for VideoCard component (plan 04-05).

# Metrics

**Duration:** 12 minutes
**Tasks Completed:** 6/6 (100%)
**Files Created:** 3 (useWebRTCConnection.ts, useSpeakerDetection.ts, useConnectionQuality.ts)
**Files Modified:** 1 (roomStore.ts)
**Total Lines Added:** 1,170 lines
**Commits:** 6 atomic commits
**Verification:** All automated checks passed

## Success Criteria ✅

- [x] src/store/roomStore.ts extended with WebRTC state (isMuted, isVideoOff, activeSpeakerId, producers, consumers)
- [x] src/hooks/useWebRTCConnection.ts creates audio/video producers and consumes incoming streams
- [x] src/hooks/useSpeakerDetection.ts monitors audio levels with debouncing
- [x] src/hooks/useConnectionQuality.ts tracks bitrate, packet loss, connection type
- [x] Producer mute/unmute works and updates roomStore
- [x] Consumer tracks can be attached to video elements
- [x] Speaker detection pattern documented for VideoCard integration
- [x] All hooks include proper cleanup
- [x] Ready for video grid UI implementation (plan 04-05)

# Implementation Notes

## Producer Lifecycle
1. Get router RTP capabilities from server
2. Create mediasoup Device and load capabilities
3. Create send transport for producers
4. Create audio producer from local stream
5. Create video producer from local stream
6. Handle producer pause/resume (mute/unmute)
7. Close producers on unmount

## Consumer Lifecycle
1. Listen for 'new-producer' events from server
2. Filter own producers (don't consume own streams)
3. Emit 'consume' request with RTP capabilities
4. Receive consumer data (id, producerId, kind, rtpParameters)
5. Create consumer from transport
6. Attach track to HTMLVideoElement via srcObject
7. Resume consumer to start receiving media
8. Handle consumer close/track end events

## Speaker Detection Pattern
Speaker detection should be implemented in VideoCard component (plan 04-05):
```typescript
useSpeakerDetection({
  audioTrack: consumer.track,
  onSpeakerDetected: () => setActiveSpeakerId(userId),
  threshold: -60,
  debounceMs: 1000
})
```

## Connection Quality Monitoring
The useConnectionQuality hook provides:
- Bitrate calculation (kbps)
- Packet loss percentage
- Connection type (host/srflx/relay)
- Quality level (good/degraded/poor)
- Helper functions for UI (getQualityColor, getQualityIcon, etc.)

## Next Steps

**Plan 04-05: Video Grid UI**
- Create VideoGrid component with auto-responsive layout (1-12 participants)
- Create VideoCard component for individual participant
- Integrate speaker detection for border highlight
- Integrate connection quality status indicator
- Implement participant name/photo display

**Plan 04-06: Control Bar**
- Create ControlBar component (bottom bar, always visible)
- Implement mute/unmute button with red background visual feedback
- Implement camera toggle button with icon change
- Implement leave room button (red/prominent styling)
- Implement settings button for device selection

**Plan 04-07: Session Timer**
- Create SessionTimer component with 45-minute countdown
- Display timer on header with accent color
- Format as "42:15 remaining"
- No color change throughout session (no urgency signals)

## Self-Check: PASSED ✅

**Files Created:**
- ✅ src/hooks/useWebRTCConnection.ts (546 lines, exceeds 200 minimum)
- ✅ src/hooks/useSpeakerDetection.ts (189 lines, exceeds 80 minimum)
- ✅ src/hooks/useConnectionQuality.ts (270 lines, exceeds 100 minimum)
- ✅ .planning/phases/04-webrtc-integration/04-04-SUMMARY.md

**Files Modified:**
- ✅ src/store/roomStore.ts (165 lines, exceeds 130 minimum)

**Commits:**
- ✅ fd48067: feat(04-04): extend roomStore with WebRTC state
- ✅ 4f8d9d8: feat(04-04): complete producer logic in useWebRTCConnection
- ✅ cdea74c: feat(04-04): implement consumer logic for incoming streams
- ✅ a89273e: feat(04-04): create speaker detection hook
- ✅ 0c3e646: feat(04-04): create connection quality hook
- ✅ 054b882: feat(04-04): integrate speaker detection with useWebRTCConnection

**Verification:**
- ✅ All WebRTC state properties added to roomStore (isMuted, isVideoOff, activeSpeakerId, producers, consumers)
- ✅ Producer functions implemented (produceAudio, produceVideo, replaceTrack, toggleAudio, toggleVideo)
- ✅ Consumer functions implemented (createConsumer, attachConsumerTrack)
- ✅ Speaker detection hook with AudioContext and AnalyserNode
- ✅ Connection quality hook with bitrate, packet loss, and quality level tracking
- ✅ Speaker detection integration documented for VideoCard component
- ✅ All hooks include proper cleanup and error handling
- ✅ No hardcoded empty values or stubs that block functionality
- ✅ Threat mitigations applied (audio processing throttling, own-producer filtering)

**Ready for:** Plan 04-05 (Video Grid UI)

