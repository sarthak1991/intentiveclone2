/**
 * Email Templates
 *
 * Contains all email templates for FocusFlow notifications.
 * Language follows NOTF-03: gentle nudges, not alarms.
 */

interface TemplateContext {
  userName: string
  roomTime: string
  roomUrl: string
  appName?: string
}

/**
 * Session Reminder Email Template
 *
 * Sent 15 minutes before a registered session.
 * Language: Encouraging, friendly reminder.
 */
export function sessionReminderTemplate(context: TemplateContext): {
  subject: string
  html: string
  text: string
} {
  const { userName, roomTime, roomUrl, appName = 'FocusFlow' } = context

  const subject = `Your focus session starts soon! 🎯`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Session Reminder</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${appName}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #333;">Hi ${userName},</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #555; line-height: 1.6;">
                Just a friendly reminder that your focus room starts in 15 minutes. We're excited to see you!
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #555; line-height: 1.6;">
                <strong>🕐 Your session:</strong> ${roomTime}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${roomUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Join Your Focus Room
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0 0; font-size: 14px; color: #888; text-align: center;">
                See you soon! 🚀
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
Hi ${userName},

Just a friendly reminder that your focus room starts in 15 minutes. We're excited to see you!

Your session: ${roomTime}

Join here: ${roomUrl}

See you soon! 🚀

---
${appName}
  `.trim()

  return { subject, html, text }
}

/**
 * No-Show Alert Email Template
 *
 * Sent after a user misses a registered session.
 * Language: Supportive, understanding, not shaming.
 */
export function noShowAlertTemplate(context: {
  userName: string
  missedTime: string
  nextRoomUrl: string
  appName?: string
}): {
  subject: string
  html: string
  text: string
} {
  const { userName, missedTime, nextRoomUrl, appName = 'FocusFlow' } = context

  const subject = `We missed you today! 💙`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>We Missed You</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">${appName}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px 0; font-size: 18px; color: #333;">Hi ${userName},</p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #555; line-height: 1.6;">
                We noticed you couldn't make it to your focus session at ${missedTime}. That's totally okay — life happens!
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #555; line-height: 1.6;">
                Remember, every session is a fresh start. No pressure, no guilt — we're just here to support you whenever you're ready to focus.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${nextRoomUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Book Your Next Session
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 30px 0 0 0; font-size: 14px; color: #888; text-align: center;">
                You've got this! 💪
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const text = `
Hi ${userName},

We noticed you couldn't make it to your focus session at ${missedTime}. That's totally okay — life happens!

Remember, every session is a fresh start. No pressure, no guilt — we're just here to support you whenever you're ready to focus.

Book your next session: ${nextRoomUrl}

You've got this! 💪

---
${appName}
  `.trim()

  return { subject, html, text }
}
