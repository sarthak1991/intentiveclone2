import { describe, it, expect } from 'vitest'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

describe('NextAuth Configuration', () => {
  it('should have credentials provider configured', () => {
    const credentialsProvider = authOptions.providers?.find(p => p.id === 'credentials')
    expect(credentialsProvider).toBeDefined()
  })

  it('should have google provider configured', () => {
    const googleProvider = authOptions.providers?.find(p => p.id === 'google')
    expect(googleProvider).toBeDefined()
  })

  it('should have email provider configured', () => {
    const emailProvider = authOptions.providers?.find(p => p.id === 'email')
    expect(emailProvider).toBeDefined()
  })

  it('should have three providers total', () => {
    expect(authOptions.providers?.length).toBe(3)
  })

  it('should have jwt callback configured', () => {
    expect(authOptions.callbacks?.jwt).toBeDefined()
  })

  it('should have session callback configured', () => {
    expect(authOptions.callbacks?.session).toBeDefined()
  })

  it('should configure session strategy as jwt', () => {
    expect(authOptions.session?.strategy).toBe('jwt')
  })

  it('should configure session max age to 7 days', () => {
    expect(authOptions.session?.maxAge).toBe(7 * 24 * 60 * 60)
  })

  it('should configure jwt max age to 15 minutes', () => {
    expect(authOptions.jwt?.maxAge).toBe(15 * 60)
  })

  it('should configure custom pages', () => {
    expect(authOptions.pages?.signIn).toBe('/login')
    expect(authOptions.pages?.error).toBe('/login')
    expect(authOptions.pages?.verifyRequest).toBe('/login/verify')
    expect(authOptions.pages?.newUser).toBe('/onboarding/step1')
  })
})
