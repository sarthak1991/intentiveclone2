# 🎉 FocusFlow - Ready to Test!

## 🚀 Project is Running!

**URL:** http://localhost:3000

---

## 👤 Test Accounts

### Both accounts now use the same password:

**Regular User**
- **Email:** `user@test.com`
- **Password:** `Password123!`

**Admin User**
- **Email:** `admin@test.com`
- **Password:** `Password123!`

---

## ✅ What's Fixed

1. ✅ **Homepage now has Login & Sign Up buttons**
2. ✅ **Both passwords updated to `Password123!`**

---

## 🎯 How to Test Right Now

### Step 1: Open the Application
Go to: **http://localhost:3000**

You'll see:
- Welcome page with gradient background
- Big heading: "Welcome to FocusFlow"
- Two buttons:
  - **"Log In"** button (primary)
  - **"Sign Up"** button (outline)

### Step 2: Log In
1. Click **"Log In"** button
2. Enter credentials:
   - Email: `user@test.com`
   - Password: `Password123!`
3. Click "Log In"

You'll be redirected to the rooms page!

### Step 3: Explore as Regular User

After logging in, you can:

#### 🏠 View Rooms
- **URL:** http://localhost:3000/rooms
- See 8 daily focus rooms (9am - 4pm)
- Times shown in your timezone (Asia/Kolkata)
- Each room card shows:
  - Scheduled time
  - Capacity (12 participants)
  - Current participants
  - Interest tags
  - Status (Upcoming, Open, Full)

#### 🔄 Switch Views
- Click **"List View"** to see all rooms in a grid
- Click **"Calendar View"** to see a calendar with date picker
- Select different dates to see rooms for that day

#### 📋 Register for Rooms
- Click on any room card to see details
- **Register button** enables 30 minutes before session
- If room is not full, you can register
- After registering:
  - Button shows "Registered"
  - You can cancel registration

#### 🚪 Join Room
- After registering, click **"Join Room"** button
- Goes to room detail page with:
  - Participant list
  - Countdown timer
  - Room information

### Step 4: Test Admin Features

1. **Log out** (click logout in top right)
2. **Log in as admin:**
   - Email: `admin@test.com`
   - Password: `Password123!`

3. **Go to Admin Panel:**
   - **URL:** http://localhost:3000/admin
   - Or click "Admin" in navigation (if available)

4. **Admin Features:**
   - **Dashboard** - See all rooms at a glance
   - **Create Room** - Add new rooms with custom times
   - **Edit Rooms** - Modify existing room details
   - **Cancel Rooms** - Remove scheduled sessions
   - **No-Show Management** - Mark users as no-shows
   - **Interest Tags** - Add/edit/delete categories

---

## 🎨 What You'll See

### Homepage (Before Login)
- Beautiful gradient background (blue to indigo)
- Large "Welcome to FocusFlow" heading
- Description of the app
- **Two buttons:** Log In & Sign Up
- Tagline about focus rooms

### Rooms Page (After Login)
- Clean grid layout with room cards
- Each card shows:
  - Time (e.g., "9:00 AM")
  - Status badge (Upcoming/Open/Full)
  - Participant count (e.g., "3/12")
  - Interest tags
  - Register/Join button
- Toggle between List/Calendar views
- Responsive design (works on mobile)

### Room Detail Page
- Large countdown timer
- Participant list with names/photos
- Room information
- Interest tags
- Join button (if registered)

### Admin Panel
- Table view of all rooms
- Action buttons (Edit, Cancel)
- "Create Room" button
- Navigation tabs for different admin functions

---

## 🧪 Testing Checklist

### Basic Flow
- [ ] Open http://localhost:3000
- [ ] See Login & Sign Up buttons on homepage
- [ ] Click "Log In"
- [ ] Log in with `user@test.com` / `Password123!`
- [ ] See rooms page
- [ ] Switch to calendar view
- [ ] Click a room card
- [ ] See room details
- [ ] Log out
- [ ] Log in with `admin@test.com` / `Password123!`
- [ ] Access admin panel
- [ ] Create a new room
- [ ] Log out

### What Works Now
- ✅ Homepage with login/signup buttons
- ✅ User authentication
- ✅ Room viewing (list & calendar)
- ✅ Room registration
- ✅ Room details
- ✅ Admin panel (full CRUD)
- ✅ Timezone display (Asia/Kolkata)
- ✅ Real-time infrastructure (Socket.IO ready)

### What's Coming Later
- ❌ Video calling (Phase 4)
- ❌ Live chat (Phase 3)
- ❌ Task/goal system (Phase 5)
- ❌ Payments (Phase 6)
- ❌ Notifications (Phase 6)

---

## 🔧 Technical Details

**Servers Running:**
- ✅ Next.js on http://localhost:3000
- ✅ Socket.IO on port 3001
- ✅ MongoDB on localhost:27017

**Database:**
- ✅ 2 test users created
- ✅ 8 daily rooms scheduled
- ✅ Room registration system ready

**Security:**
- ✅ Passwords hashed with bcrypt
- ✅ JWT sessions
- ✅ HTTP-only cookies
- ✅ Admin authorization

---

## 🐛 Troubleshooting

**Can't see login buttons?**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Clear browser cache
- Check http://localhost:3000 is accessible

**Login not working?**
- Verify email: `user@test.com` or `admin@test.com`
- Verify password: `Password123!` (with capital P and !)
- Check browser console for errors

**Page not loading?**
- Check server is running: `lsof -ti:3000`
- Restart server: `npm run dev`
- Check MongoDB is running: `docker-compose -f .docker/mongodb/docker-compose.yml ps`

---

## 📊 Current Status

**Completed:**
- ✅ Phase 1: Authentication (100%)
- ✅ Phase 2: Room Management (100%)

**Progress:** 2/7 phases (29%)

**Total Features:** 20/77 requirements implemented

---

## 🎯 Quick Test Path

**Fastest way to see everything:**

1. **Open:** http://localhost:3000
2. **Click:** "Log In"
3. **Login:** user@test.com / Password123!
4. **Browse:** Rooms page (auto-redirect)
5. **Click:** Calendar view toggle
6. **Click:** Any room card
7. **Logout:** Top right corner
8. **Login:** admin@test.com / Password123!
9. **Browse:** Admin panel at /admin
10. **Create:** New room with custom time

**Total time:** 2-3 minutes to see all features!

---

## 💡 Tips

- **Browser DevTools** - Open Console (F12) to see Socket.IO logs
- **MongoDB Compass** - Connect to mongodb://localhost:27017 to view data
- **Network Tab** - See API calls and response times

---

**Enjoy testing FocusFlow!** 🚀

The application is fully functional with authentication, room management, and admin features ready to explore!

---

## Phase 3: Real-Time Infrastructure

### Overview

Phase 3 implements real-time room presence and live text chat using Socket.IO, Zustand state management, and React hooks. The following components were added:

- **server/presence.ts** — Server-side presence tracking with heartbeat cleanup
- **src/store/roomStore.ts** — Zustand store for real-time room state
- **src/hooks/useSocket.ts** — Socket.IO connection lifecycle hook
- **src/hooks/useRoomPresence.ts** — Presence tracking with 15s heartbeat
- **src/hooks/useRoomChat.ts** — Chat message sending and history
- **src/components/room/ParticipantList.tsx** — Live participant list UI
- **src/components/room/ChatBox.tsx** — Chat interface with auto-scroll

### Server Setup

**Start Socket.IO server:**

```bash
cd server
npm install  # First time only
npm start
```

Server runs on port 3001 (configurable via `SOCKET_PORT` env var).

**Verify server is running:**

Open a browser and visit `http://localhost:3001/socket.io/` — you should see a 200 OK response with Socket.IO metadata.

Or check the server console for:

```
Socket.IO server running on port 3001
CORS origin: http://localhost:3000
```

### Manual Testing Procedures

**Prerequisites:**
- MongoDB running (`npm run docker:mongo`)
- Socket.IO server running (`cd server && npm start`)
- Next.js dev server running (`npm run dev`)
- Two browser windows open

---

**Test 1: Presence Tracking**

1. Log in as `user@test.com` in Window 1
2. Navigate to a room detail page (e.g. `/room/{roomId}`)
3. Log in as a different user in Window 2 (use incognito)
4. Navigate to the same room in Window 2
5. Verify ParticipantList shows both users in both windows
6. Close Window 2 — verify ParticipantList updates to show only Window 1 user
7. Check browser console for heartbeat messages (emitted every 15s)

**Expected:** Participant count updates within 1 second of join/leave.

---

**Test 2: Live Text Chat**

1. Open two browser windows to the same room (as different users)
2. Type a message in Window 1's ChatBox
3. Press Enter or click Send
4. Verify message appears in both Window 1 and Window 2 within 100ms
5. Verify message shows correct sender name and timestamp
6. Try sending an empty message — it should not send
7. Try sending a message over 500 characters — it should show an error

**Expected:** Messages appear in both windows instantly with sender info.

---

**Test 3: Chat History**

1. Send 5 messages from Window 1 in a room
2. Close Window 1 and re-open the same room
3. Verify the last 50 messages load automatically on join
4. Messages should display in chronological order (oldest first)
5. Chat should auto-scroll to the latest message on load

**Expected:** Full message history loads on join, up to 50 messages.

---

**Test 4: Rate Limiting**

1. In one browser window, send 10 messages rapidly in one room
2. Send an 11th message — it should display an error toast
3. Error should say something like "Rate limit exceeded"
4. Wait 1 minute and send again — it should succeed
5. Check server logs to confirm rate limit enforcement

**Expected:** 11th message within 60 seconds is rejected with an error event.

---

**Test 5: Reconnection Handling**

1. Join a room in the browser
2. Note current participants and recent chat messages
3. Stop the Socket.IO server (`Ctrl+C` in the server terminal)
4. Wait a few seconds — browser console should show reconnection attempts
5. Restart the Socket.IO server (`cd server && npm start`)
6. Verify the client reconnects automatically (no page refresh needed)
7. Verify participant list resyncs after reconnection
8. Verify chat history reloads (no duplicate messages)

**Expected:** Auto-reconnect within ~5 seconds, state fully restored.

---

**Test 6: Multiple Tabs (User Deduplication)**

1. Open 3 browser tabs to the same room, all logged in as the same user
2. Verify the user appears only once in the ParticipantList (not 3 times)
3. Close one tab — user should still be in the list (2 tabs remaining)
4. Close all tabs — user should be removed from the list
5. Open browser console in each tab to verify heartbeat events

**Expected:** Single user counts as one participant regardless of tab count.

---

### Expected Behavior Summary

| Feature | Behavior |
|---------|----------|
| Participant join | List updates within 1 second |
| Participant leave | List updates within 30 seconds (heartbeat timeout) |
| Chat send | Message appears in all windows within 100ms |
| Chat history | Last 50 messages load on room join |
| Rate limit | 10 messages/minute per user |
| Reconnection | Auto-reconnect with exponential backoff (1s to 5s max) |
| Multiple tabs | Single user, deduplicated by userId |
| Disconnected state | Chat input disabled until reconnected |

### Automated Tests

Run Phase 3 automated tests:

```bash
# All Phase 3 tests
npx vitest run tests/presence/ tests/chat/ tests/store/ tests/hooks/ tests/models/ChatMessage.test.ts

# Specific test suites
npx vitest run tests/presence/          # Server-side presence tracking (15 tests)
npx vitest run tests/chat/              # Chat integration and hooks (18 tests)
npx vitest run tests/store/             # Zustand store (10 tests)
npx vitest run tests/hooks/             # React hooks (15 tests)
npx vitest run tests/models/ChatMessage.test.ts  # ChatMessage model (8 tests)
```

**Expected result:** 61 tests passing.

### Troubleshooting

**Presence not updating:**
- Check that the Socket.IO server is running on port 3001
- Open browser DevTools > Network > WS tab to see WebSocket connection
- Look for authentication errors in the server console
- Verify `NEXTAUTH_SECRET` env var matches between Next.js and Socket.IO server

**Chat messages not appearing:**
- Check server console for `chat-message` event logs
- Verify MongoDB is running and connected (check server console)
- Check for rate limit errors in browser console (`chat-error` events)
- Verify both clients are in the same room namespace (`/room-{roomId}`)

**Reconnection not working:**
- Ensure the Socket.IO server was fully restarted (not just crashed)
- Check browser console for reconnection attempt logs
- Verify port 3001 is not blocked by firewall
- Try a manual page refresh as a fallback

**"Cannot connect to socket" error:**
- Set `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001` in `.env.local`
- Ensure Socket.IO server is running before starting Next.js
- Check CORS configuration in `server/socket-server.ts` matches your app URL

**Tests failing with MongoDB errors:**
- Tests require MongoDB running locally (`npm run docker:mongo`)
- Tests run sequentially (`fileParallelism: false` in vitest.config.ts)
- Run individual test files to isolate failures

### Test Data Setup

Use existing seeded users from Phase 1/2:

- **Regular user:** `user@test.com` / `Password123!`
- **Admin user:** `admin@test.com` / `Password123!`

Create additional test users via the sign-up page at `http://localhost:3000`.

Rooms are auto-scheduled daily at 9am-4pm by the cron job. You can also create rooms manually via the admin panel at `/admin`.
