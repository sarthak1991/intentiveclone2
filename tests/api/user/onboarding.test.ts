import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/user/onboarding/route'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  connectDB: vi.fn()
}))

vi.mock('@/models/User', () => ({
  User: {
    findByIdAndUpdate: vi.fn()
  }
}))

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  auth: vi.fn()
}))

describe('Onboarding API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject unauthenticated requests', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/user/onboarding', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Unauthorized')
  })

  it('should save onboarding data for authenticated users', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' }
    })

    vi.mocked(connectDB).mockResolvedValue(undefined)
    vi.mocked(User.findByIdAndUpdate).mockResolvedValue({ _id: 'user123' })

    const onboardingData = {
      name: 'John Doe',
      timezone: 'Asia/Kolkata',
      interests: ['coding', 'design']
    }

    const request = new Request('http://localhost:3000/api/user/onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      expect.objectContaining({
        name: 'John Doe',
        timezone: 'Asia/Kolkata',
        interests: ['coding', 'design'],
        isOnboarded: true
      })
    )
  })

  it('should handle errors gracefully', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' }
    })

    vi.mocked(connectDB).mockRejectedValue(new Error('Database connection failed'))

    const request = new Request('http://localhost:3000/api/user/onboarding', {
      method: 'POST',
      body: JSON.stringify({})
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to save onboarding data')
  })

  it('should save all onboarding fields', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' }
    })

    vi.mocked(connectDB).mockResolvedValue(undefined)
    vi.mocked(User.findByIdAndUpdate).mockResolvedValue({ _id: 'user123' })

    const onboardingData = {
      name: 'Jane Doe',
      photoId: 'photo123',
      photoUrl: '/api/photos/photo123',
      timezone: 'America/New_York',
      interests: ['writing', 'reading']
    }

    const request = new Request('http://localhost:3000/api/user/onboarding', {
      method: 'POST',
      body: JSON.stringify(onboardingData)
    })

    const response = await POST(request as NextRequest)

    expect(response.status).toBe(200)
    expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      {
        name: 'Jane Doe',
        photoId: 'photo123',
        photoUrl: '/api/photos/photo123',
        timezone: 'America/New_York',
        interests: ['writing', 'reading'],
        isOnboarded: true
      }
    )
  })
})
