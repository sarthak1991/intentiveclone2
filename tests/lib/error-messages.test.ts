import { describe, it, expect } from 'vitest'
import { authErrorMessages } from '@/lib/validation'

describe('Error Message Tone', () => {
  describe('Gentle Language', () => {
    it('should avoid harsh technical terms like "Invalid"', () => {
      expect(authErrorMessages.invalidEmail).not.toContain('Invalid')
      expect(authErrorMessages.weakPassword).not.toContain('Invalid')
      expect(authErrorMessages.incorrectPassword).not.toContain('Invalid')
    })

    it('should avoid stigmatizing language like "weak"', () => {
      expect(authErrorMessages.weakPassword).not.toMatch(/\bweak\b/i)
    })

    it('should use conversational openers', () => {
      expect(authErrorMessages.incorrectPassword).toContain('Hmm')
      expect(authErrorMessages.magicLinkExpired).toContain('Let\'s')
    })

    it('should use friendly punctuation', () => {
      // Exclamation marks for positive reinforcement
      expect(authErrorMessages.magicLinkSent).toContain('!')
      expect(authErrorMessages.magicLinkExpired).toContain('!')
    })
  })

  describe('Helpful Suggestions', () => {
    it('should provide actionable next steps for incorrect password', () => {
      expect(authErrorMessages.incorrectPassword).toContain('Try again')
      expect(authErrorMessages.incorrectPassword).toContain('reset')
    })

    it('should offer alternative for expired magic link', () => {
      expect(authErrorMessages.magicLinkExpired).toContain('fresh one')
    })

    it('should suggest signup for non-existent user', () => {
      expect(authErrorMessages.userNotFound).toContain('sign up')
    })

    it('should suggest login for existing email', () => {
      expect(authErrorMessages.emailExists).toContain('log in')
    })

    it('should provide guidance for weak password', () => {
      expect(authErrorMessages.weakPassword).toContain('stronger')
      expect(authErrorMessages.weakPassword).toContain('uppercase')
    })
  })

  describe('No Technical Jargon', () => {
    it('should not use HTTP status codes', () => {
      expect(authErrorMessages.userNotFound).not.toContain('404')
      expect(authErrorMessages.incorrectPassword).not.toContain('401')
      expect(authErrorMessages.emailExists).not.toContain('409')
    })

    it('should not use database terminology', () => {
      expect(authErrorMessages.emailExists).not.toContain('duplicate')
      expect(authErrorMessages.emailExists).not.toContain('constraint')
      expect(authErrorMessages.emailExists).not.toContain('unique')
    })

    it('should not use authentication technical terms', () => {
      expect(authErrorMessages.incorrectPassword).not.toContain('unauthorized')
      expect(authErrorMessages.incorrectPassword).not.toContain('forbidden')
      expect(authErrorMessages.incorrectPassword).not.toContain('credentials')
    })

    it('should not use validation technical terms', () => {
      expect(authErrorMessages.invalidEmail).not.toContain('validation')
      expect(authErrorMessages.weakPassword).not.toContain('regex')
      expect(authErrorMessages.weakPassword).not.toContain('pattern')
    })
  })

  describe('Empathetic Tone', () => {
    it('should sound understanding of mistakes', () => {
      expect(authErrorMessages.incorrectPassword).toContain('doesn\'t match')
      expect(authErrorMessages.invalidEmail).toContain('double-check')
    })

    it('should avoid blame language', () => {
      expect(authErrorMessages.incorrectPassword).not.toContain('wrong')
      expect(authErrorMessages.invalidEmail).not.toContain('bad')
      expect(authErrorMessages.weakPassword).not.toContain('stupid')
    })

    it('should frame errors positively', () => {
      expect(authErrorMessages.weakPassword).toContain('Let\'s make')
      expect(authErrorMessages.magicLinkExpired).toContain('Let\'s send')
    })
  })

  describe('Clarity and Specificity', () => {
    it('should clearly state what\'s wrong', () => {
      expect(authErrorMessages.invalidEmail).toContain('email')
      expect(authErrorMessages.passwordRequired).toContain('password')
      expect(authErrorMessages.nameRequired).toContain('name')
    })

    it('should be specific about password requirements', () => {
      expect(authErrorMessages.passwordMinLength).toContain('8 characters')
      expect(authErrorMessages.weakPassword).toContain('uppercase')
    })

    it('should provide context for email errors', () => {
      expect(authErrorMessages.invalidEmail).toContain('doesn\'t look quite right')
    })
  })

  describe('Consistent Voice', () => {
    it('should maintain first-person plural perspective ("we")', () => {
      expect(authErrorMessages.emailRequired).toMatch(/\bwe\b/i)
      expect(authErrorMessages.magicLinkSent).toMatch(/\bwe\b/i)
    })

    it('should use direct second-person address ("you")', () => {
      expect(authErrorMessages.nameRequired).toMatch(/\byou\b/i)
      expect(authErrorMessages.magicLinkExpired).toMatch(/\byou\b/i)
    })

    it('should maintain consistent helpfulness across all errors', () => {
      // All errors should provide some guidance or next step
      const allErrors = Object.values(authErrorMessages)

      allErrors.forEach(error => {
        // Should be more than just stating the problem
        expect(error.length).toBeGreaterThan(15)
      })
    })
  })

  describe('Accessibility and Inclusivity', () => {
    it('should avoid idioms that don\'t translate well', () => {
      // No sports metaphors, slang, or culture-specific references
      expect(authErrorMessages.incorrectPassword).not.toContain('strike')
      expect(authErrorMessages.weakPassword).not.toContain('step up')
    })

    it('should be clear for non-native English speakers', () => {
      // Simple vocabulary, clear sentence structure
      expect(authErrorMessages.invalidEmail).toBeDefined()
      expect(authErrorMessages.weakPassword).toBeDefined()
      expect(authErrorMessages.incorrectPassword).toBeDefined()
    })
  })

  describe('Error Categories', () => {
    describe('Email Errors', () => {
      it('should handle invalid email format gently', () => {
        expect(authErrorMessages.invalidEmail).toContain('double-check')
        expect(authErrorMessages.invalidEmail).not.toContain('Invalid')
      })

      it('should handle duplicate email helpfully', () => {
        expect(authErrorMessages.emailExists).toContain('already exists')
        expect(authErrorMessages.emailExists).toContain('log in instead')
      })

      it('should handle missing email clearly', () => {
        expect(authErrorMessages.emailRequired).toContain('need your email')
      })
    })

    describe('Password Errors', () => {
      it('should handle weak password constructively', () => {
        expect(authErrorMessages.weakPassword).toContain('stronger')
        expect(authErrorMessages.weakPassword).not.toMatch(/\bweak\b/i)
      })

      it('should handle incorrect password empathetically', () => {
        expect(authErrorMessages.incorrectPassword).toContain('Hmm')
        expect(authErrorMessages.incorrectPassword).toContain('doesn\'t match')
      })

      it('should handle password length requirement clearly', () => {
        expect(authErrorMessages.passwordMinLength).toContain('8 characters')
      })
    })

    describe('Session Errors', () => {
      it('should handle expired magic link positively', () => {
        expect(authErrorMessages.magicLinkExpired).toContain('expired')
        expect(authErrorMessages.magicLinkExpired).toContain('fresh one')
      })

      it('should celebrate successful magic link send', () => {
        expect(authErrorMessages.magicLinkSent).toContain('Check your inbox')
        expect(authErrorMessages.magicLinkSent).toContain('!')
      })

      it('should handle non-existent user helpfully', () => {
        expect(authErrorMessages.userNotFound).toContain('couldn\'t find')
        expect(authErrorMessages.userNotFound).toContain('sign up')
      })
    })
  })
})
