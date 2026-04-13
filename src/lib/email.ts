import nodemailer from 'nodemailer'

/**
 * Email Service Configuration
 *
 * Supports Gmail (MVP), SendGrid, and AWS SES.
 * Provider is selected via EMAIL_PROVIDER environment variable.
 */

type EmailProvider = 'gmail' | 'sendgrid' | 'ses'

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER as EmailProvider) || 'gmail'

/**
 * Create transporter based on provider
 */
function createTransporter() {
  switch (EMAIL_PROVIDER) {
    case 'gmail':
      // Gmail with app-specific password
      if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set for Gmail provider')
      }
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      })

    case 'sendgrid':
      // SendGrid
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error('SENDGRID_API_KEY must be set for SendGrid provider')
      }
      return nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY
        }
      })

    case 'ses':
      // AWS SES
      if (!process.env.AWS_SES_HOST || !process.env.AWS_SES_USER || !process.env.AWS_SES_PASSWORD) {
        throw new Error('AWS_SES_HOST, AWS_SES_USER, and AWS_SES_PASSWORD must be set for SES provider')
      }
      return nodemailer.createTransport({
        host: process.env.AWS_SES_HOST,
        port: 465,
        secure: true,
        auth: {
          user: process.env.AWS_SES_USER,
          pass: process.env.AWS_SES_PASSWORD
        }
      })

    default:
      throw new Error(`Unknown email provider: ${EMAIL_PROVIDER}`)
  }
}

/**
 * Send an email
 *
 * @param options - Email options (to, subject, html, text)
 * @returns Promise with info about the sent email
 */
export async function sendEmail(options: {
  to: string
  subject: string
  html: string
  text?: string
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = createTransporter()

    // Verify transporter configuration
    await transporter.verify()

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'FocusFlow <hello@focusflow.app>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || stripHtml(options.html)
    })

    console.log(`[EmailService] Email sent to ${options.to}: ${info.messageId}`)

    return {
      success: true,
      messageId: info.messageId
    }
  } catch (error) {
    console.error(`[EmailService] Failed to send email to ${options.to}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Basic HTML to text converter (fallback)
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}
