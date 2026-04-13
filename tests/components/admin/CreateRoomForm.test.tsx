import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { CreateRoomForm } from '@/components/admin/CreateRoomForm'

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn()
  })
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock fetch
global.fetch = vi.fn()

describe('CreateRoomForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        room: {
          _id: '123',
          title: 'Focus Room',
          scheduledTime: new Date().toISOString(),
          duration: 45,
          capacity: 12
        }
      })
    })
  })

  it('should render all form fields', () => {
    render(<CreateRoomForm />)

    expect(screen.getByLabelText('Room Title')).toBeInTheDocument()
    expect(screen.getByLabelText('Scheduled Time *')).toBeInTheDocument()
    expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument()
    expect(screen.getByLabelText('Capacity')).toBeInTheDocument()
    expect(screen.getByLabelText('Interest Tags')).toBeInTheDocument()
  })

  it('should have default values', () => {
    render(<CreateRoomForm />)

    const titleInput = screen.getByLabelText('Room Title') as HTMLInputElement
    const durationInput = screen.getByLabelText('Duration (minutes)') as HTMLInputElement
    const capacityInput = screen.getByLabelText('Capacity') as HTMLInputElement

    expect(titleInput.value).toBe('Focus Room')
    expect(durationInput.value).toBe('45')
    expect(capacityInput.value).toBe('12')
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    // Clear scheduled time to make it invalid
    const scheduledTimeInput = screen.getByLabelText('Scheduled Time *')
    await user.clear(scheduledTimeInput)

    // Try to submit - button should be disabled since form is dirty and invalid
    const submitButton = screen.getByRole('button', { name: /create room/i })
    expect(submitButton).toBeDisabled()
  })

  it('should validate datetime format', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    const scheduledTimeInput = screen.getByLabelText('Scheduled Time *')
    await user.clear(scheduledTimeInput)
    await user.type(scheduledTimeInput, 'invalid-datetime')

    const submitButton = screen.getByRole('button', { name: /create room/i })
    await user.click(submitButton)

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/invalid datetime format/i)).toBeInTheDocument()
    })
  })

  it('should validate capacity limits', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    const capacityInput = screen.getByLabelText('Capacity')
    await user.clear(capacityInput)
    await user.type(capacityInput, '15')

    // Should show validation error immediately on blur
    capacityInput.blur()
    await waitFor(() => {
      expect(screen.getByText(/capacity cannot exceed 12/i)).toBeInTheDocument()
    })
  })

  it('should validate duration limits', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    const durationInput = screen.getByLabelText('Duration (minutes)')
    await user.clear(durationInput)
    await user.type(durationInput, '10')

    durationInput.blur()
    await waitFor(() => {
      expect(screen.getByText(/duration must be at least 15 minutes/i)).toBeInTheDocument()
    })
  })

  it('should submit form with correct data', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    const submitButton = screen.getByRole('button', { name: /create room/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/rooms',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: expect.stringContaining('Focus Room')
        })
      )
    })
  })

  it('should show loading state while submitting', async () => {
    const user = userEvent.setup()
    // Mock slow API response
    ;(global.fetch as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, room: {} })
      }), 100))
    )

    render(<CreateRoomForm />)

    const submitButton = screen.getByRole('button', { name: /create room/i })
    await user.click(submitButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /creating\.\.\./i })).toBeInTheDocument()
    })
  })

  it('should show success toast on success', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    const submitButton = screen.getByRole('button', { name: /create room/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Room created successfully')
    })
  })

  it('should show error toast on failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to create room' })
    })

    render(<CreateRoomForm />)

    const submitButton = screen.getByRole('button', { name: /create room/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create room')
    })
  })

  it('should redirect to admin rooms on success', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    const submitButton = screen.getByRole('button', { name: /create room/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/rooms')
    })
  })

  it('should call onSuccess callback if provided', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    render(<CreateRoomForm onSuccess={onSuccess} />)

    const submitButton = screen.getByRole('button', { name: /create room/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('should parse interest tags from comma-separated string', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    const tagsInput = screen.getByLabelText('Interest Tags')
    await user.type(tagsInput, 'coding, writing, learning')

    const submitButton = screen.getByRole('button', { name: /create room/i })
    await user.click(submitButton)

    await waitFor(() => {
      const fetchCall = (global.fetch as any).mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.interestTags).toEqual(['coding', 'writing', 'learning'])
    })
  })

  it('should cancel and redirect when cancel button clicked', async () => {
    const user = userEvent.setup()
    render(<CreateRoomForm />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    expect(mockPush).toHaveBeenCalledWith('/admin/rooms')
  })
})
