# TURN Server Deployment Guide

This guide covers deploying coturn TURN server for FocusFlow's WebRTC infrastructure. TURN is mandatory for 20-40% of users behind restrictive NAT/firewalls.

## Overview

**What is TURN?** TURN (Traversal Using Relays around NAT) relays media traffic when direct P2P connection fails. Without TURN, users behind corporate firewalls, symmetric NAT, or restrictive ISP configurations cannot connect to video rooms.

**When do you need TURN?**
- User behind symmetric NAT (common in enterprise networks)
- UDP blocked by firewall (TCP fallback needed)
- ICE candidate gathering fails to find direct path
- Testing shows: 20-40% of users need TURN for connectivity

**Architecture:** FocusFlow uses coturn with REST API for dynamic credential generation. Credentials are time-limited (1 hour TTL) with HMAC-SHA1 signature to prevent leakage.

---

## Deployment Options

### Option 1: Docker (Recommended for Development)

**Pros:** Easy setup, reproducible, low resource usage, isolated environment
**Cons:** Additional Docker overhead, not production-optimized
**Best for:** Development, testing, low-traffic deployments (< 50 concurrent users)

### Option 2: System Package (Production)

**Pros:** Better performance, direct system integration, easier monitoring
**Cons:** Manual setup, system-specific configuration
**Best for:** Production deployments, high-traffic scenarios

### Option 3: STUN-Only (Development Fallback)

**Pros:** No infrastructure needed, free Google STUN servers
**Cons:** 20-40% connectivity failure, not production-ready
**Best for:** Early development, testing WebRTC without TURN setup

---

## Option 1: Docker Deployment (Minimal Resources)

### Prerequisites

- Docker installed (v20.10+)
- 512MB RAM available
- Port 3478 (UDP/TCP) and 5349 (TLS) available

### Quick Start

1. **Create docker-compose.yml** (root of project):

```yaml
version: '3.8'

services:
  coturn:
    image: coturn/coturn:latest
    container_name: focusflow-turn
    restart: unless-stopped
    network_mode: host  # Required for proper NAT traversal

    # Resource limits (minimal for development)
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

    environment:
      # TURN server configuration
      - TURN_SERVER_NAME=turn.focusflow.com
      - TURN_PORT=3478
      - TURN_TLS_PORT=5349

      # REST API for dynamic credentials
      - TURN_REST_API_ENABLED=true
      - TURN_SECRET=your-hmac-secret-change-in-production

      # Network configuration
      - TURN_EXTERNAL_IP=${TURN_EXTERNAL_IP:-auto}

      # Logging
      - TURN_LOG_FILE=/var/log/coturn.log
      - TURN_LOG_LEVEL=INFO

    volumes:
      # Persist logs
      - ./turn-logs:/var/log/coturn

    # Health check
    healthcheck:
      test: ["CMD", "turnserver", "--version"]
      interval: 30s
      timeout: 10s
      retries: 3
```

2. **Create .env file** (root of project):

```bash
# TURN Server Configuration
TURN_SERVER_URL=turn.focusflow.com  # Replace with your domain or IP
TURN_SECRET=your-hmac-secret-change-in-production  # Generate with: openssl rand -base64 32
TURN_EXTERNAL_IP=auto  # Or set to your server's public IP

# Optional: Use IP address instead of domain
# TURN_SERVER_URL=123.45.67.89
```

3. **Generate TURN_SECRET** (run in terminal):

```bash
openssl rand -base64 32
```

4. **Start TURN server**:

```bash
docker-compose up -d coturn
```

5. **Verify TURN server is running**:

```bash
# Check container status
docker ps | grep coturn

# Check logs
docker logs focusflow-turn

# Test connectivity
nc -zv localhost 3478  # Should return: Connection to localhost 3478 port [udp/*] succeeded!
```

### Resource Optimization

The docker-compose.yml above uses minimal resources suitable for development:
- **CPU:** 0.25-0.5 cores (shared with other containers)
- **Memory:** 256-512MB RAM
- **Bandwidth:** ~500 Mbps for 50 concurrent video users

If TURN takes too many resources, switch to **STUN-only mode** (see below).

---

## Option 2: System Package Deployment (Production)

### Prerequisites

- Ubuntu 20.04+ or Debian 11+
- 2 vCPU, 2GB RAM (recommended for production)
- Public IP address or domain with DNS record
- Ports 3478 (UDP/TCP) and 5349 (TLS) open in firewall

### Installation Steps

1. **Install coturn**:

```bash
sudo apt update
sudo apt install coturn -y
```

2. **Configure coturn** (/etc/turnserver.conf):

```bash
# /etc/turnserver.conf

# Network configuration
listening-port=3478
tls-listening-port=5349

# External IP (replace with your server's public IP)
external-ip=123.45.67.89

# Authentication
lt-cred-mech
user=myuser:mypassword  # Or use REST API (see below)

# REST API for dynamic credentials
rest-api-enabled=true
rest-api-secrets=your-hmac-secret-change-in-production

# Logging
log-file=/var/log/coturn.log
verbose
```

3. **Enable coturn service**:

```bash
sudo systemctl enable coturn
sudo systemctl start coturn
```

4. **Open firewall ports**:

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3478/tcp
sudo firewall-cmd --permanent --add-port=3478/udp
sudo firewall-cmd --permanent --add-port=5349/tcp
sudo firewall-cmd --permanent --add-port=5349/udp
sudo firewall-cmd --reload
```

5. **Test TURN server**:

```bash
# Check service status
sudo systemctl status coturn

# Test connectivity
nc -zv your-turn-server.com 3478
```

6. **Set environment variables** (in application .env):

```bash
TURN_SERVER_URL=your-turn-server.com
TURN_SECRET=your-hmac-secret-change-in-production
```

---

## Option 3: STUN-Only Mode (Development Fallback)

If Docker/system deployment takes too many resources or you're in early development, use STUN-only mode.

**Warning:** STUN-only fails for 20-40% of users. NOT production-ready.

### How to Switch to STUN-Only

1. **Remove TURN server configuration** from .env:

```bash
# Comment out or remove these lines:
# TURN_SERVER_URL=turn.focusflow.com
# TURN_SECRET=your-hmac-secret-change-in-production
```

2. **Update webrtc-server.ts** (already handles STUN-only fallback):

```typescript
// server/webrtc-server.ts
export function getIceServers(turnCredentials?: TurnCredentials): RTCConfiguration['iceServers'] {
  const iceServers: RTCConfiguration['iceServers'] = [
    // Google public STUN (free, reliable)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]

  // TURN server added only if credentials provided
  if (turnCredentials && process.env.TURN_SERVER_URL) {
    iceServers.push({
      urls: `turn:${process.env.TURN_SERVER_URL}:3478`,
      username: turnCredentials.username,
      credential: turnCredentials.password,
    })
  }

  return iceServers
}
```

3. **Client will automatically use STUN-only** when TURN_SERVER_URL is not set.

### When to Use STUN-Only

- Early development (before WebRTC implementation complete)
- Testing on local network (no NAT traversal needed)
- Resource-constrained environments (can't run TURN server)

### When NOT to Use STUN-Only

- Production deployment (users will fail to connect)
- Testing with remote users (NAT traversal required)
- Any multi-user video room scenario

---

## Testing TURN Connectivity

### 1. Trickle ICE Test (Browser-Based)

1. Open: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
2. Enter TURN server credentials:
   - URI: `turn:your-turn-server.com:3478`
   - Username: (from TURN credentials response)
   - Password: (from TURN credentials response)
3. Click "Gather candidates"
4. **Expected result:** Should see "srflx" (server-reflexive) and "relay" candidates

### 2. Command-Line Test

```bash
# Install turnutils
sudo apt install turnserver-client

# Test TURN connectivity
turnutils_uclient -v -y -u username -w password your-turn-server.com
```

### 3. Application Test

```bash
# Start Socket.IO server with TURN enabled
cd server
npm run dev

# In browser console, request TURN credentials:
socket.emit('get-turn-credentials')
socket.on('turn-credentials', (data) => {
  console.log('TURN credentials:', data)
  console.log('ICE servers:', data.iceServers)
})
```

---

## Troubleshooting

### TURN Server Not Starting

**Symptom:** Container exits immediately, service fails to start

**Solutions:**
1. Check logs: `docker logs focusflow-turn` or `sudo journalctl -u coturn`
2. Verify port availability: `netstat -tulpn | grep 3478`
3. Check configuration syntax: `turnserver --check-config` (system package)
4. Ensure external IP is correct (set TURN_EXTERNAL_IP in .env)

### TURN Credentials Not Working

**Symptom:** ICE connection fails, no "relay" candidates

**Solutions:**
1. Verify TURN_SECRET matches between server and coturn config
2. Check TURN_SERVER_URL is reachable from client (test with `nc -zv`)
3. Ensure firewall allows UDP 3478 (TURN requires UDP, not just TCP)
4. Check credential expiration (TTL = 1 hour, re-request if expired)

### High Resource Usage

**Symptom:** Docker container using > 512MB RAM, high CPU

**Solutions:**
1. Reduce Docker limits in docker-compose.yml (already set to 512MB)
2. Switch to STUN-only mode (remove TURN_SERVER_URL from .env)
3. Use external TURN service (e.g., Twilio Network Traversal) - costs money

### Connection Fails Behind Firewall

**Symptom:** User cannot connect, no video/audio

**Solutions:**
1. Verify TURN is running (not STUN-only): `echo $TURN_SERVER_URL`
2. Check client is using TURN credentials (look for "relay" candidates in browser WebRTC logs)
3. Test with Trickle ICE tool: https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
4. If still failing, TURN server may be misconfigured (check logs)

### Docker Network Issues

**Symptom:** TURN server not reachable from other containers

**Solutions:**
1. Use `network_mode: host` in docker-compose.yml (required for NAT traversal)
2. Do NOT use custom networks (breaks ICE candidate gathering)
3. Ensure TURN_SERVER_URL uses host IP, not container IP

---

## Production Considerations

### Security

1. **Use TLS** (TURN over TLS) for production:
   ```bash
   # Add SSL certificate path to turnserver.conf
   cert=/etc/ssl/certs/turn_focusflow.com.pem
   pkey=/etc/ssl/private/turn_focusflow.com.key
   ```

2. **Rotate TURN_SECRET** periodically (monthly recommended):
   ```bash
   # Generate new secret
   openssl rand -base64 32

   # Update .env and restart TURN server
   docker-compose restart coturn
   ```

3. **Rate limit credential generation** (already implemented in socket-server.ts):
   ```typescript
   // Max 1 credential per minute per user
   const recentCount = await TurnCredential.countDocuments({
     userId: user.id,
     timestamp: { $gte: new Date(Date.now() - 60000) }
   })
   ```

### Scaling

- **1 vCPU, 1GB RAM:** Supports ~50 concurrent video users
- **2 vCPU, 2GB RAM:** Supports ~100 concurrent video users
- **Bandwidth:** ~500 Mbps per 50 concurrent video users

### Monitoring

```bash
# Check TURN server logs
docker logs -f focusflow-turn

# Monitor active connections (system package)
sudo turnutils_stunclient --verbose your-turn-server.com

# Monitor resource usage
docker stats focusflow-turn
```

### High Availability

For production deployments with > 100 concurrent users:
1. Deploy multiple TURN servers (load balanced)
2. Use geographically distributed TURN servers (low latency)
3. Implement health checks and failover (add multiple TURN URLs to ICE config)

---

## Switching Between TURN and STUN-Only

### From TURN to STUN-Only

1. Stop TURN server: `docker-compose down coturn`
2. Remove from .env: `TURN_SERVER_URL` and `TURN_SECRET`
3. Restart application: `npm run dev`

### From STUN-Only to TURN

1. Add to .env:
   ```bash
   TURN_SERVER_URL=turn.focusflow.com
   TURN_SECRET=your-hmac-secret-change-in-production
   ```
2. Start TURN server: `docker-compose up -d coturn`
3. Restart application: `npm run dev`

### Verify Mode

Check browser console for ICE candidates:
- **STUN-only:** Only "host" and "srflx" candidates
- **TURN enabled:** "relay" candidates present (indicates TURN working)

---

## Cost Estimate

### Self-Hosted TURN (Docker)

- **Infrastructure:** $6-12/mo (DigitalOcean 1 vCPU, 1GB RAM)
- **Bandwidth:** Included in VPS bandwidth (1TB/mo typical)
- **Total:** $6-12/mo for ~50 concurrent users

### Production TURN (System Package)

- **Infrastructure:** $24-48/mo (DigitalOcean 2-4 vCPU, 2-8GB RAM)
- **Bandwidth:** Overage charges if > 1TB/mo
- **Total:** $24-48/mo for ~100 concurrent users

### STUN-Only

- **Infrastructure:** $0 (Google public STUN servers)
- **Cost:** $0 (but 20-40% connectivity failure)

---

## References

- [coturn GitHub](https://github.com/coturn/coturn)
- [coturn Wikipedia](https://wikipedia.org/wiki/COTURN)
- [WebRTC ICE Explained](https://webrtc.org/getting-started/turn-server)
- [Trickle ICE Test](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)
- [RFC 5766 - TURN Protocol](https://tools.ietf.org/html/rfc5766)

---

## Support

For issues specific to FocusFlow's TURN implementation:
1. Check this guide's troubleshooting section
2. Review coturn logs: `docker logs focusflow-turn`
3. Test with Trickle ICE tool
4. Open GitHub issue with logs and error description

For general coturn issues:
- [coturn mailing list](https://groups.google.com/g/coturn)
- [coturn GitHub issues](https://github.com/coturn/coturn/issues)
