import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sendMagicLinkEmail, sendPasswordResetEmail } from '@/lib/email'

// Mock nodemailer - factory must be self-contained
vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
  return {
    default: {
      createTransport: vi.fn(() => ({
        sendMail: mockSendMail,
      })),
    },
    // Export the mock for testing
    __mockSendMail: mockSendMail,
  }
})

// Get the mock function
const nodemailer = await import('nodemailer')
const mockSendMail = (nodemailer as any).__mockSendMail

describe('Email Utilities', () => {
  beforeEach(() => {
    mockSendMail.mockClear()
    mockSendMail.mockResolvedValue({ messageId: 'test-message-id' })
  })

  describe('sendMagicLinkEmail', () => {
    it('should send magic link email with correct parameters', async () => {
      const email = 'test@example.com'
      const url = 'https://focusflow.com/api/auth/callback?token=test-token'

      await sendMagicLinkEmail(email, url)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Your FocusFlow login link',
          html: expect.stringContaining(url),
        })
      )
    })

    it('should include magic link in email body', async () => {
      const email = 'test@example.com'
      const url = 'https://focusflow.com/api/auth/callback?token=test-token'

      await sendMagicLinkEmail(email, url)

      const callArgs = mockSendMail.mock.calls[0][0]
      expect(callArgs.html).toContain(url)
      expect(callArgs.html).toContain('15 minutes')
    })
  })

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const email = 'test@example.com'
      const url = 'https://focusflow.com/reset-password?token=test-token'

      await sendPasswordResetEmail(email, url)

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: email,
          subject: 'Reset your FocusFlow password',
          html: expect.stringContaining(url),
        })
      )
    })

    it('should include reset link in email body', async () => {
      const email = 'test@example.com'
      const url = 'https://focusflow.com/reset-password?token=test-token'

      await sendPasswordResetEmail(email, url)

      const callArgs = mockSendMail.mock.calls[0][0]
      expect(callArgs.html).toContain(url)
      expect(callArgs.html).toContain('1 hour')
    })
  })
})
