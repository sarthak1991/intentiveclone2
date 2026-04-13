# Plan 05-06 Summary: Admin Captain Management

**Completed:** 2026-04-08
**Plan:** 05-06 - Admin captain management (ADMN-04, ADMN-07)

---

## What Was Implemented

### 1. API Endpoints

**src/app/api/admin/captains/assign/route.ts**
- POST: Assign captain to specific room with emergency override
  - Admin-only endpoint
  - Validates roomId, userId, isEmergency flag
  - Creates/updates CaptainAssignment with status='accepted'
  - Updates Room.captainId
  - Emergency assignment bypasses eligibility check (per CAPT-03 D-14)
- DELETE: Remove captain assignment
  - Deletes assignment record
  - Clears Room.captainId

**src/app/api/admin/captains/remarks/route.ts** (GET)
- Admin-only endpoint
- Returns all captain remarks with populated fields
- Filters for assignments where remarks exists
- Populates userId (captain), roomId (room), assignedBy (admin)
- Sorted by assignedAt descending (newest first)

**src/app/api/captains/[roomId]/remarks/route.ts**
- GET: Returns remarks for this room's captain assignment
- POST: Submit remarks (captain only, max 500 chars)
  - Verifies captain status (room.captainId OR accepted CaptainAssignment)
  - Creates/updates CaptainAssignment.remarks field

**src/app/api/users/route.ts** (GET)
- Admin-only endpoint
- Returns user list for dropdowns (id, name, email)
- Sorted by name alphabetically

### 2. Admin UI Components

**src/components/admin/CaptainAssignment.tsx**
- Room dropdown: Select from available rooms
- User dropdown: Select from all users
- Emergency checkbox: "Emergency assignment (skip eligibility)"
  - Shows warning when checked: "This will bypass the 4+ session requirement"
- Assign Captain button: Creates assignment via POST /api/admin/captains/assign
- Current Assignments table:
  - Columns: Captain name, Room title, Status badge, Actions
  - Status badges: Invited (yellow), Accepted (green), Declined (red), Removed (outline)
  - Remove button: Deletes assignment via DELETE /api/admin/captains/assign/[id]

**src/components/admin/CaptainRemarks.tsx**
- Card with "Captain Remarks" title and "Feedback from room captains" description
- Lists all captain remarks with:
  - Captain name
  - Room title
  - Remark text (truncated to 200 chars with "Read more" expansion)
  - Relative date (formatRelative from date-fns)
- Empty state: "No captain remarks yet."

**src/app/admin/rooms/page.tsx** (modified)
- Added imports for CaptainAssignment and CaptainRemarks
- Added "Captain Management" section below main content
- 2-column grid layout: CaptainAssignment (left), CaptainRemarks (right)

### 3. Captain Panel Enhancement

**src/components/room/CaptainPanel.tsx** (modified)
- Added Session Notes section:
  - Textarea for remark input (max 500 chars)
  - Character counter: "X/500"
  - Submit Note button (disabled when empty or submitting)
  - Displays existing remarks below input
- Fetches existing remarks from GET /api/captains/[roomId]/remarks on mount
- Handles remark submission with toast notifications

### 4. UI Components

**src/components/ui/checkbox.tsx** (new)
- Radix UI checkbox component
- Used in CaptainAssignment for emergency checkbox

**src/components/ui/textarea.tsx** (new)
- Textarea component for multi-line input
- Used in CaptainPanel for session notes

---

## Key Constraints Enforced

1. **Admin-only access** - All admin endpoints verify user.role === 'admin'
2. **Emergency override** - Admin can assign any user as captain regardless of eligibility (per CAPT-03 D-14)
3. **Remarks 500 char limit** - Enforced in Zod validation
4. **Captain-only remarks** - Only captain can submit remarks for their room
5. **Assignment cleanup** - DELETE clears Room.captainId when assignment removed

---

## Verification (Checkpoint Required)

### Human Verification Steps

1. Start dev server: `npm run dev`
2. Login as admin
3. Navigate to `/admin/rooms`
4. Scroll to "Captain Management" section
5. **Test Assignment:**
   - Select a room from dropdown
   - Select a user from dropdown
   - Check "Emergency assignment" checkbox
   - Click "Assign Captain" - verify success message
   - Verify assignment appears in "Current Assignments" table
6. **Test Remarks:**
   - Submit a remark as captain in a room
   - Go to admin page
   - Verify remark appears in "Captain Remarks" section
   - Verify "Read more" works for long remarks
7. **Test Removal:**
   - Click Remove button for an assignment
   - Verify assignment is removed from table

**Expected Results:**
- Emergency checkbox shows warning
- Assignment creates CaptainAssignment record
- Remarks display correctly with captain info
- Remove button deletes assignment

---

## Success Criteria (from PLAN.md)

1. [x] Admin can assign captains to specific sessions
2. [x] Admin can assign any user as captain (emergency)
3. [x] Admin can view captain remarks
4. [x] Captains can submit remarks about sessions
5. [x] Assignment history visible to admin
6. [x] Remarks stored per session
7. [x] All APIs require admin or captain authorization

**Status: COMPLETE - Awaiting Human Verification**
