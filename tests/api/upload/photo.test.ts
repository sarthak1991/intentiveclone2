import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '@/app/api/upload/photo/route'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

// Mock dependencies
vi.mock('@/lib/db', () => ({
  connectDB: vi.fn()
}))

vi.mock('@/models/User', () => ({
  getPhotoBucket: vi.fn(),
  User: {
    findByIdAndUpdate: vi.fn()
  }
}))

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  auth: vi.fn()
}))

describe('Photo Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject unauthenticated requests', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue(null)

    const request = new Request('http://localhost:3000/api/upload/photo', {
      method: 'POST',
      body: new FormData()
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.error).toBe('Please log in to upload a photo')
  })

  it('should reject requests without file', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' }
    })

    const formData = new FormData()
    const request = new Request('http://localhost:3000/api/upload/photo', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Please choose a photo to upload')
  })

  it('should reject files larger than 5MB', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' }
    })

    const formData = new FormData()
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg'
    })
    formData.append('photo', largeFile)

    const request = new Request('http://localhost:3000/api/upload/photo', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('File too large')
  })

  it('should reject non-image files', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' }
    })

    const formData = new FormData()
    const pdfFile = new File(['PDF content'], 'document.pdf', {
      type: 'application/pdf'
    })
    formData.append('photo', pdfFile)

    const request = new Request('http://localhost:3000/api/upload/photo', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('valid image file')
  })

  it('should accept valid image files under 5MB', async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/route')
    vi.mocked(auth).mockResolvedValue({
      user: { id: 'user123', email: 'test@example.com' }
    })

    const { getPhotoBucket } = await import('@/models/User')
    const mockUploadStream = {
      id: 'photo123',
      write: vi.fn(),
      end: vi.fn(),
      on: vi.fn((event, callback) => {
        if (event === 'finish') {
          setTimeout(callback, 0)
        }
      })
    }
    vi.mocked(getPhotoBucket).mockReturnValue({
      openUploadStream: vi.fn(() => mockUploadStream)
    } as any)

    vi.mocked(connectDB).mockResolvedValue(undefined)
    vi.mocked(User.findByIdAndUpdate).mockResolvedValue({ _id: 'user123' })

    const formData = new FormData()
    const imageFile = new File(['image content'], 'photo.jpg', {
      type: 'image/jpeg'
    })
    formData.append('photo', imageFile)

    const request = new Request('http://localhost:3000/api/upload/photo', {
      method: 'POST',
      body: formData
    })

    const response = await POST(request as NextRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.photoId).toBe('photo123')
  })
})
