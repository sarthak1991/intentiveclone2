# Testing Guide

## Overview

This document covers testing practices for FocusFlow, including unit tests, integration tests, and manual testing procedures.

## Test Framework

- **Framework:** Vitest 4.1.2
- **Test Environment:** jsdom (browser-like environment)
- **Setup File:** `tests/setup.ts`
- **Coverage Tool:** V8 (built into Vitest)

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- webrtc-connection
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Tests UI (Optional)

```bash
npm test -- --ui
```

## Test Structure

```
tests/
├── setup.ts                 # Shared test setup and mocks
├── unit/                    # Unit tests
│   ├── auth/               # Authentication tests
│   ├── webrtc/             # WebRTC hook/component tests
│   ├── hooks/              # Custom hook tests
│   └── components/         # Component tests
└── integration/            # Integration tests
    ├── api/                # API endpoint tests
    ├── webrtc/             # WebRTC integration tests
    └── socket/             # Socket.IO tests
```

## WebRTC Testing

### WebRTC Unit Tests

WebRTC unit tests cover individual hooks and components in isolation:

```bash
# Test useMediaStream hook
npm test -- use-media-stream

# Test VideoGrid component
npm test -- video-grid

# Test SessionTimer component
npm test -- session-timer

# Test useAttendanceTracking hook
npm test -- attendance-tracking
```

**Coverage Target:** >80% for WebRTC code

### WebRTC Integration Tests

WebRTC integration tests require a running server and real WebRTC environment. Currently implemented as placeholders:

```bash
# Test WebRTC connection flow
npm test -- webrtc-connection

# Test 12-person room capacity
npm test -- 12-person-room

# Test overflow room logic
npm test -- overflow-room

# Test TURN/ICE configuration
npm test -- turn-connectivity

# Test captain controls
npm test -- captain-controls
```

**Note:** Full integration tests require:
- Running mediasoup server (`server/webrtc-server.ts`)
- Running Socket.IO server (`server/socket-server.ts`)
- TURN server deployment (coturn)
- Real WebRTC environment (browser or Puppeteer)

For now, use manual testing for full integration verification.

### WebRTC Test Environment Setup

#### Local Development (STUN-only)

For local development without TURN server:

```bash
# Start Socket.IO server
npm run dev:server

# Start Next.js dev server
npm run dev

# Test in browser at http://localhost:3000
```

**Note:** STUN-only configuration works for ~60-80% of users. Participants behind restrictive NAT/firewall will fail to connect.

#### TURN Server Deployment

For production testing with TURN server:

1. **Deploy coturn TURN server** (see `server/turn-deployment.md`)

2. **Configure TURN credentials** in `.env`:
```env
TURN_SERVER_URL=turn://your-turn-server:3478
TURN_SECRET=your-secret-key
```

3. **Test TURN connectivity**:
```bash
npm test -- turn-connectivity
```

### Manual Testing Checklist

#### Basic Video Connection

- [ ] User can join video room with camera and microphone
- [ ] User can see own video in preview
- [ ] User can mute/unmute microphone
- [ ] User can toggle camera on/off
- [ ] Mute visual feedback shows (red background + icon change)
- [ ] Camera off visual feedback shows (red background + icon change)

#### Multi-Participant Testing

- [ ] 2 users can connect to same room
- [ ] Both users can see each other's video
- [ ] Both users can hear each other's audio
- [ ] Speaker border highlights active speaker
- [ ] Video grid adapts layout (1-3, 4-6, 7-9, 10-12 participants)

#### 12-Person Room Capacity

- [ ] 12 participants can connect to room
- [ ] 13th participant receives 'room-full' error
- [ ] Participant count updates correctly in UI
- [ ] All participants see correct video grid layout

#### Overflow Room Testing

- [ ] Overflow room auto-created when 13th participant joins
- [ ] Overflow room named "{Room Name} - Overflow"
- [ ] 13th participant redirected to overflow room
- [ ] Up to 16 total participants (12 main + 4 overflow)
- [ ] 17th participant receives 'room-full' error
- [ ] Chat messages shared between main and overflow rooms
- [ ] Presence shows combined count (Main: 12/12, Overflow: 4/4)

#### Attendance Tracking

- [ ] Attendance timer starts when user connects
- [ ] Timer pauses on disconnect
- [ ] Timer resumes on reconnect
- [ ] "Attended" badge appears after 90 seconds
- [ ] Toast notification shown when attendance confirmed
- [ ] Attendance persists across page refresh

#### Session Timer

- [ ] Countdown timer displays in header
- [ ] Timer shows "X:XX remaining" format
- [ ] Timer counts down every second
- [ ] Timer reaches 0:00 when session ends
- [ ] Accent color styling applied (no color change)

#### Connection Quality

- [ ] Connection status indicator shows (green/yellow/red dot)
- [ ] Tooltip shows connection details on hover
- [ ] Silent reconnection in background (no intrusive alerts)

#### TURN/ICE Connectivity

- [ ] Direct connection works (same network)
- [ ] STUN connection works (different network, open NAT)
- [ ] TURN connection works (restrictive NAT/firewall)
- [ ] ICE fallback hierarchy works (TURN → STUN → failure)

### Troubleshooting WebRTC Issues

#### getUserMedia Fails

**Symptom:** "Camera and microphone access is required" error

**Solutions:**
- Check browser permissions (allow camera/microphone)
- Check if another app is using camera/microphone
- Try HTTPS (required for getUserMedia, except localhost)
- Check browser console for specific error

#### TURN Connection Fails

**Symptom:** "ICE connection failed" or "Could not establish connection"

**Solutions:**
- Verify TURN server is running (`systemctl status coturn`)
- Check TURN server logs (`journalctl -u coturn`)
- Verify TURN credentials (username format, HMAC signature)
- Check firewall rules (UDP 3478, TCP 3478, TLS 5349)
- Test TURN connectivity with `turnutils_uclient` command

#### Memory Leaks

**Symptom:** Memory usage grows over time

**Solutions:**
- Verify transport cleanup on disconnect (`transport.close()`)
- Verify producer/consumer cleanup (`producer.close()`, `consumer.close()`)
- Check for multiple socket connections (should be one per room)
- Monitor memory usage with `top` or `htop`

#### Video Layout Breaks

**Symptom:** Video cards overlap or have wrong aspect ratio

**Solutions:**
- Check responsive breakpoints (mobile vs desktop)
- Verify Tailwind CSS grid classes
- Test on actual mobile devices (iOS Safari, Android Chrome)
- Check for CSS conflicts with other components

### Performance Benchmarks

#### 12-Person Room

- **Memory:** <2GB RAM for 12 participants
- **CPU:** <80% CPU usage
- **Connection Time:** <5 seconds to establish WebRTC connection
- **Bitrate:** ~500kbps per participant (video) + ~64kbps (audio)

#### TURN Server

- **Bandwidth:** ~500 Mbps per 50 concurrent video users
- **Latency:** <100ms for TURN-relayed connections
- **Connection Success Rate:** >95% with TURN (vs 60-80% with STUN-only)

## Test Mocks

### WebRTC Mocks (`tests/setup.ts`)

```typescript
// Mock getUserMedia
global.navigator.mediaDevices.getUserMedia = vi.fn(() =>
  Promise.resolve(mockMediaStream)
)

// Mock mediasoup (server)
vi.mock('mediasoup', () => ({
  createWorker: vi.fn(() => mockWorker)
}))

// Mock mediasoup-client (browser)
vi.mock('mediasoup-client', () => ({
  Device: vi.fn(() => mockDevice)
}))

// Mock Socket.IO
vi.mock('@/lib/socket', () => ({
  socket: {
    emit: vi.fn(),
    on: vi.fn(),
  }
}))
```

### Fixtures

```typescript
// Mock Room document
export const mockRoom = {
  _id: new ObjectId(),
  name: '9:00 AM Focus Room',
  capacity: 12,
  // ...
}

// Mock User document
export const mockUser = {
  _id: new ObjectId(),
  name: 'Test User',
  email: 'test@example.com',
  // ...
}

// Mock MediaStream
export const mockMediaStream = {
  getAudioTracks: () => [mockAudioTrack],
  getVideoTracks: () => [mockVideoTrack],
  // ...
}
```

## Best Practices

### Unit Tests

- **Isolation:** Each test should be independent (use `beforeEach` for setup)
- **Mocking:** Mock external dependencies (APIs, databases, WebRTC)
- **Coverage:** Target >80% code coverage for critical paths
- **Fast:** Unit tests should run in <100ms each

### Integration Tests

- **Realistic:** Use real server responses (mock at HTTP boundary)
- **Idempotent:** Tests should be repeatable (cleanup database after each test)
- **Focused:** Test specific integration points, not entire system

### WebRTC Tests

- **Mock WebRTC APIs:** Use fake getUserMedia, RTCPeerConnection in unit tests
- **Manual Integration:** Use manual testing for full WebRTC flows
- **TURN Mocking:** Mock TURN server in CI/CD (don't call real TURN)
- **Browser Testing:** Test real WebRTC in browser (Chrome, Firefox, Safari)

## Continuous Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
- Run unit tests: `npm test -- --run`
- Check coverage: `npm run test:coverage`
- Verify >80% coverage for WebRTC code
- Skip integration tests (require running server)
```

### Pre-Commit Hooks

```bash
# Run tests before commit
npx husky install
echo "npm test -- --run" > .husky/pre-commit
```

## Test Coverage

### Current Coverage

- **Overall:** TBD (run `npm run test:coverage`)
- **WebRTC:** Target >80%
- **Authentication:** >90%
- **API Endpoints:** >85%

### Viewing Coverage Report

```bash
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## Debugging Tests

### Run Tests in Debug Mode

```bash
# Run single test file with debugger
npm test -- use-media-stream --run --inspect-brk

# Open Chrome DevTools and connect to debugger
# chrome://inspect
```

### Console Output

```bash
# Show console.log in tests
npm test -- --reporter=verbose
```

### Test Timeout

```bash
# Increase timeout for slow tests
vi.setConfig({ testTimeout: 10000 }) // 10 seconds
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [WebRTC Testing Guide](https://webrtc.org/getting-started/testing)
- [mediasoup Testing](https://mediasoup.org/documentation/v3/testing/)

---

**Last Updated:** 2026-04-07
**Phase:** 04 - WebRTC Integration
**Status:** Unit tests complete, integration tests pending server deployment
