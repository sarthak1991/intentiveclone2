# Phase 6: Notifications - Implementation Plan

**Created:** 2026-04-08
**Status:** Ready to Execute
**Plans:** 3

## Goal

Email reminders and no-show alerts are operational.

## Requirements

- **NOTF-01**: User receives email reminder 15 minutes before registered session
- **NOTF-02**: User receives gentle no-show alert if missed registered session
- **NOTF-03**: System sends gentle notification language (nudges, not alarms)

## Success Criteria

1. User receives email reminder 15 minutes before registered session
2. User receives gentle no-show alert if missed registered session
3. All notification language uses gentle nudges, not alarms

---

## Plan 06-01: Email Service Setup

**Requirements:** NOTF-03
**Effort:** Medium

### Tasks

1. Install `nodemailer` and configure email provider
   - Use Gmail with app-specific password for MVP (or SES/SendGrid for production)
   - Configure environment variables for email credentials

2. Create email templates
   - Session reminder template (gentle, encouraging)
   - No-show alert template (supportive, not shaming)
   - Use consistent branding and friendly tone

3. Create email utility module
   - `src/lib/email.ts` - `sendEmail()` function
   - `src/lib/email-templates.ts` - template functions
   - Error handling and logging

### Implementation Details

**Email Provider Options:**
- Gmail (free, app-specific password) - use for MVP
- SendGrid (free tier 100 emails/day) - use for production
- AWS SES (pay-as-you-go) - use at scale

**Template Language Guidelines (NOTF-03):**
- Use "gentle nudge" language, not "alarm"
- Focus on support and encouragement, not guilt
- Avoid: "Don't forget!", "You missed!", "Warning!"
- Use: "Just a reminder", "We missed you", "Ready to focus?"

---

## Plan 06-02: Session Reminder Scheduler

**Requirements:** NOTF-01, NOTF-03
**Effort:** Medium

### Tasks

1. Create reminder scheduler cron job
   - `server/notification-scheduler.ts`
   - Run every 5 minutes: `*/5 * * * *`
   - Find rooms starting in 15 minutes (±5 minute window)

2. Query registered users for upcoming rooms
   - Join with User model to get email addresses
   - Filter users who haven't already received reminder for this session

3. Send reminder emails
   - Use session reminder template
   - Include room time, user's timezone
   - Add one-click join link

4. Track reminder sent status
   - Add `reminderSent` boolean to Registration model
   - Update after sending to prevent duplicates

### Implementation Details

**Query Logic:**
```typescript
// Find rooms starting 10-20 minutes from now
const windowStart = new Date(Date.now() + 10 * 60 * 1000)
const windowEnd = new Date(Date.now() + 20 * 60 * 1000)

const upcomingRooms = await Room.find({
  scheduledTime: { $gte: windowStart, $lt: windowEnd },
  status: { $in: ['scheduled', 'open', 'full'] }
})
```

**Email Content:**
- Subject: "Your focus session starts soon! 🎯"
- Greeting: "Hi [name],"
- Body: "Just a friendly reminder that your focus room starts in 15 minutes. We're excited to see you!"
- Link: "Join Room" button

---

## Plan 06-03: No-Show Detection & Alerts

**Requirements:** NOTF-02, NOTF-03
**Effort:** Medium

### Tasks

1. Create no-show detection cron job
   - Add to `server/notification-scheduler.ts`
   - Run every 15 minutes: `*/15 * * * *`
   - Find recently completed rooms

2. Detect no-shows
   - Find registrations with status 'registered' for completed rooms
   - Check if SessionCompletion exists for userId/roomId
   - If no completion record → mark as no-show

3. Update registration status
   - Set Registration.status to 'no-show'
   - Log for analytics

4. Send no-show alert emails
   - Use no-show template (supportive tone)
   - Include encouragement, not guilt
   - Link to next available room

### Implementation Details

**Query Logic:**
```typescript
// Find rooms completed in last hour
const lastHour = new Date(Date.now() - 60 * 60 * 1000)

const completedRooms = await Room.find({
  scheduledTime: { $gte: lastHour },
  status: 'completed'
})

// Find registered users who didn't attend
const noShowRegs = await Registration.find({
  roomId: { $in: completedRooms.map(r => r._id) },
  status: 'registered'
})
```

**Email Content (gentle, per NOTF-03):**
- Subject: "We missed you today! 💙"
- Greeting: "Hi [name],"
- Body: "We noticed you couldn't make it to your focus session. That's totally okay - life happens!"
- Encouragement: "Remember, every session is a fresh start. We're here when you're ready."
- Link: "Book your next session"

---

## Implementation Order

1. **06-01**: Email Service Setup (foundation)
2. **06-02**: Session Reminder Scheduler (adds value immediately)
3. **06-03**: No-Show Detection & Alerts (completes feature)

---

## Notes

- All cron jobs should be idempotent (safe to run multiple times)
- Email sending should be async and non-blocking
- Add comprehensive logging for debugging
- Consider adding notification preferences in future (opt-out option)
- For MVP, using Gmail with app-specific password is acceptable
- For production, migrate to SendGrid or AWS SES for reliability

---

*Last updated: 2026-04-08*
