# Plan 05-04 Summary: Captain Eligibility & Invitations

**Completed:** 2026-04-08
**Plan:** 05-04 - Captain eligibility & invitations (CAPT-01, CAPT-02, CAPT-03)

---

## What Was Implemented

### 1. Database Models

**src/models/CaptainAssignment.ts** (new)
- Schema with fields:
  - userId (ref User, required, indexed)
  - roomId (ref Room, required, indexed)
  - assignedBy (ref User, required) - admin who assigned
  - assignedAt (Date, default now)
  - status (enum: 'invited', 'accepted', 'declined', 'removed')
  - sessionsCaptained (Number, default 0)
  - freeSessionsEarned (Number, default 0)
  - remarks (String, optional)
- Compound unique index on userId + roomId (one assignment per user per room)
- Index on assignedBy for admin queries

**src/models/Room.ts** (modified)
- Added captainId field (ref User, nullable, indexed)
- Allows linking a captain to each room

### 2. API Endpoints

**src/app/api/captains/eligible/route.ts** (GET)
- Admin-only endpoint (verifies user.role === 'admin')
- Aggregation pipeline to find users with 4+ completed sessions (per CAPT-01)
- Groups SessionCompletion by userId, counts completed sessions
- Filters for completedCount >= 4
- Looks up User details (name, email, photoUrl)
- Filters out existing captains (users with invited/accepted status)
- Returns eligible users list with total count

**src/app/api/captains/invite/route.ts** (POST)
- Admin-only endpoint
- Validates body: { userId, roomId? }
- Verifies user exists
- Checks for existing invitation (returns 400 if duplicate)
- Creates CaptainAssignment with status='invited'
- Returns invitationId on success

**src/app/api/captains/assign/route.ts** (POST)
- Admin-only endpoint with emergency override
- Validates body: { userId, roomId, isEmergency? }
- Verifies room and user exist
- Creates/updates CaptainAssignment with status='accepted' (admin override per CAPT-03)
- Updates Room.captainId = userId
- Returns success with isEmergency flag

**src/app/api/captains/assign/route.ts** (GET)
- Admin-only endpoint
- Returns all captain assignments with populated fields
- Populates userId, roomId, assignedBy
- Sorted by assignedAt descending (newest first)

### 3. Socket.IO Events

**server/socket-server.ts** (modified)
- Import CaptainAssignment model
- Added captain event handlers in setupRoomEventHandlers:
  - `captain-invited`: Notify user of invitation
  - `captain-assigned`: Notify captain of room assignment
  - `captain-joined`: Notify room participants that captain joined
  - `captain-mute-all`: Mute all participants (verifies captainId)
  - `captain-unmute-all`: Unmute all participants (verifies captainId)
  - `captain-mute-participant`: Mute specific participant (verifies captainId)
  - `captain-unmute-participant`: Unmute specific participant (verifies captainId)

### 4. Admin UI Component

**src/components/admin/CaptainEligibility.tsx**
- Fetches eligible users from /api/captains/eligible on mount
- Displays list with:
  - Avatar (first letter of name)
  - Name, email
  - Completed sessions count badge
  - Invite button (disabled after invitation)
- Empty state: "No eligible users found. Users need 4+ completed sessions to qualify."
- Toast notifications for success/error

**src/app/admin/rooms/page.tsx** (modified)
- Added import for CaptainEligibility
- Added component in 2/3 column layout (right sidebar)
- Room management panel takes 2/3, CaptainEligibility takes 1/3

---

## Key Constraints Enforced

1. **4+ completed sessions** - Eligibility threshold enforced server-side (per CAPT-01)
2. **Admin approval only** - All endpoints require admin role verification (per CAPT-02)
3. **Emergency assignment** - Admin can assign any user regardless of eligibility (per CAPT-03 D-14)
4. **One assignment per room** - Compound unique index prevents duplicates
5. **Status tracking** - Full lifecycle: invited → accepted/declined → removed

---

## Verification (Checkpoint Required)

### Human Verification Steps

1. Start the dev server: `npm run dev`
2. Login as admin user
3. Navigate to `/admin/rooms`
4. Find "Captain Eligibility" section in right sidebar
5. Verify list shows users with 4+ completed sessions
6. Click "Invite" button for a user
7. Verify success message appears
8. Verify button changes to "Invited" (disabled)
9. Check database: `CaptainAssignment` record created with status='invited'

**Expected Results:**
- Only users with 4+ completed sessions appear
- Invite button creates CaptainAssignment record
- Invited users cannot be invited again (button disabled)

---

## Success Criteria (from PLAN.md)

1. [x] System identifies users with 4+ completed sessions
2. [x] Admin can view eligible users list
3. [x] Admin can send captain invitations
4. [x] Admin can assign captains to rooms (emergency)
5. [x] Captain status stored in database
6. [x] Socket.IO events emit captain notifications
7. [x] All captain APIs require admin authorization

**Status: COMPLETE - Awaiting Human Verification**
