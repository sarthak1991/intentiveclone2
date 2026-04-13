import cron from 'node-cron'
import { connectDB } from '../src/lib/db'
import { Room } from '../src/models/Room'
import { Registration } from '../src/models/Registration'
import { SessionCompletion } from '../src/models/SessionCompletion'
import { User } from '../src/models/User'
import { sendEmail } from '../src/lib/email'
import { sessionReminderTemplate, noShowAlertTemplate } from '../src/lib/email-templates'

/**
 * Notification Scheduler
 *
 * Handles all scheduled email notifications:
 * - Session reminders (15 minutes before)
 * - No-show alerts (after missed sessions)
 */

const SERVER_TIMEZONE = 'Asia/Kolkata'

/**
 * Send Session Reminders
 *
 * Runs every 5 minutes.
 * Finds rooms starting in 10-20 minutes and sends reminders to registered users.
 */
async function sendSessionReminders(): Promise<void> {
  try {
    await connectDB()

    const now = new Date()
    const windowStart = new Date(Date.now() + 10 * 60 * 1000)  // 10 minutes from now
    const windowEnd = new Date(Date.now() + 20 * 60 * 1000)    // 20 minutes from now

    console.log(`[NotificationScheduler] Checking for rooms starting between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`)

    // Find rooms starting in the time window
    const upcomingRooms = await Room.find({
      scheduledTime: { $gte: windowStart, $lt: windowEnd },
      status: { $in: ['scheduled', 'open', 'full'] }
    })

    if (upcomingRooms.length === 0) {
      console.log('[NotificationScheduler] No upcoming rooms found for reminder')
      return
    }

    console.log(`[NotificationScheduler] Found ${upcomingRooms.length} upcoming rooms`)

    let totalRemindersSent = 0

    for (const room of upcomingRooms) {
      // Find registrations for this room that haven't received a reminder yet
      const registrations = await Registration.find({
        roomId: room._id,
        status: 'registered',
        reminderSent: { $ne: true }
      }).populate('userId')

      if (registrations.length === 0) {
        continue
      }

      console.log(`[NotificationScheduler] Room ${room._id}: Sending ${registrations.length} reminders`)

      for (const registration of registrations) {
        const user = registration.userId as any

        if (!user || !user.email) {
          console.warn(`[NotificationScheduler] Skipping registration ${registration._id}: no user or email`)
          continue
        }

        // Format room time in user's timezone
        const roomTime = new Date(room.scheduledTime).toLocaleString('en-US', {
          timeZone: user.timezone || 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })

        // Create room URL
        const roomUrl = `${process.env.APP_URL || 'http://localhost:3000'}/room/${room._id}`

        // Send reminder email
        const { subject, html, text } = sessionReminderTemplate({
          userName: user.name,
          roomTime,
          roomUrl
        })

        const result = await sendEmail({
          to: user.email,
          subject,
          html,
          text
        })

        if (result.success) {
          // Mark reminder as sent
          await Registration.updateOne(
            { _id: registration._id },
            { reminderSent: true }
          )
          totalRemindersSent++
        } else {
          console.error(`[NotificationScheduler] Failed to send reminder to ${user.email}: ${result.error}`)
        }
      }
    }

    console.log(`[NotificationScheduler] Sent ${totalRemindersSent} session reminders`)

  } catch (error) {
    console.error('[NotificationScheduler] Error sending session reminders:', error)
    throw error
  }
}

/**
 * Detect and Alert No-Shows
 *
 * Runs every 15 minutes.
 * Finds completed rooms and detects users who registered but didn't attend.
 */
async function detectAndAlertNoShows(): Promise<void> {
  try {
    await connectDB()

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    console.log(`[NotificationScheduler] Checking for no-shows since ${oneHourAgo.toISOString()}`)

    // Find rooms completed in the last hour
    const completedRooms = await Room.find({
      scheduledTime: { $gte: oneHourAgo },
      status: 'completed'
    })

    if (completedRooms.length === 0) {
      console.log('[NotificationScheduler] No recently completed rooms found')
      return
    }

    console.log(`[NotificationScheduler] Found ${completedRooms.length} recently completed rooms`)

    let totalNoShows = 0
    let totalAlertsSent = 0

    for (const room of completedRooms) {
      // Find registrations with status 'registered' (user didn't attend)
      const noShowRegistrations = await Registration.find({
        roomId: room._id,
        status: 'registered',
        noShowAlertSent: { $ne: true }
      }).populate('userId')

      if (noShowRegistrations.length === 0) {
        continue
      }

      console.log(`[NotificationScheduler] Room ${room._id}: Found ${noShowRegistrations.length} potential no-shows`)

      // Verify these are actual no-shows by checking SessionCompletion
      for (const registration of noShowRegistrations) {
        const user = registration.userId as any

        if (!user || !user.email) {
          continue
        }

        // Check if user actually has a session completion record
        const sessionCompletion = await SessionCompletion.findOne({
          userId: user._id,
          roomId: room._id
        })

        if (sessionCompletion) {
          // User attended, update registration status
          await Registration.updateOne(
            { _id: registration._id },
            { status: 'attended' }
          )
          continue
        }

        // This is a confirmed no-show
        console.log(`[NotificationScheduler] Confirmed no-show: ${user.email} for room ${room._id}`)

        // Update registration status
        await Registration.updateOne(
          { _id: registration._id },
          { status: 'no-show' }
        )

        totalNoShows++

        // Format the missed session time
        const missedTime = new Date(room.scheduledTime).toLocaleString('en-US', {
          timeZone: user.timezone || 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        })

        // Create URL to next available room (home page with room list)
        const nextRoomUrl = `${process.env.APP_URL || 'http://localhost:3000'}/`

        // Send no-show alert email
        const { subject, html, text } = noShowAlertTemplate({
          userName: user.name,
          missedTime,
          nextRoomUrl
        })

        const result = await sendEmail({
          to: user.email,
          subject,
          html,
          text
        })

        if (result.success) {
          // Mark alert as sent
          await Registration.updateOne(
            { _id: registration._id },
            { noShowAlertSent: true }
          )
          totalAlertsSent++
        } else {
          console.error(`[NotificationScheduler] Failed to send no-show alert to ${user.email}: ${result.error}`)
        }
      }
    }

    console.log(`[NotificationScheduler] Detected ${totalNoShows} no-shows, sent ${totalAlertsSent} alerts`)

  } catch (error) {
    console.error('[NotificationScheduler] Error detecting no-shows:', error)
    throw error
  }
}

/**
 * Start the notification scheduler cron jobs
 *
 * Session Reminders: Every 5 minutes (*/5 * * * *)
 * No-Show Detection: Every 15 minutes (*/15 * * * *)
 */
export function startNotificationScheduler(): { reminderTask: cron.ScheduledTask; noShowTask: cron.ScheduledTask } {
  console.log('[NotificationScheduler] Starting notification scheduler...')

  // Session reminder job: every 5 minutes
  const reminderTask = cron.schedule('*/5 * * * *', async () => {
    console.log('[NotificationScheduler] Running session reminder job...')
    await sendSessionReminders()
  }, {
    timezone: SERVER_TIMEZONE
  })

  // No-show detection job: every 15 minutes
  const noShowTask = cron.schedule('*/15 * * * *', async () => {
    console.log('[NotificationScheduler] Running no-show detection job...')
    await detectAndAlertNoShows()
  }, {
    timezone: SERVER_TIMEZONE
  })

  console.log('[NotificationScheduler] Notification scheduler started')
  console.log('[NotificationScheduler] - Session reminders: every 5 minutes')
  console.log('[NotificationScheduler] - No-show detection: every 15 minutes')

  return { reminderTask, noShowTask }
}

/**
 * Manually trigger session reminders (for testing)
 */
export async function triggerSessionReminders(): Promise<void> {
  console.log('[NotificationScheduler] Manual session reminder trigger')
  await sendSessionReminders()
}

/**
 * Manually trigger no-show detection (for testing)
 */
export async function triggerNoShowDetection(): Promise<void> {
  console.log('[NotificationScheduler] Manual no-show detection trigger')
  await detectAndAlertNoShows()
}

// Auto-start on import (for PM2/process manager)
if (require.main === module) {
  startNotificationScheduler()
  console.log('[NotificationScheduler] Running in standalone mode - press Ctrl+C to stop')
}
