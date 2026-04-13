import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { NoShowManager } from '@/components/admin/NoShowManager'
import { IUser } from '@/models/types'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock fetch
global.fetch = vi.fn()

const mockParticipants: IUser[] = [
  {
    _id: '1' as any,
    email: 'john@example.com',
    name: 'John Doe',
    timezone: 'America/New_York',
    interests: ['coding'],
    isOnboarded: true,
    role: 'user',
    photoUrl: 'https://example.com/john.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2' as any,
    email: 'jane@example.com',
    name: 'Jane Smith',
    timezone: 'America/Los_Angeles',
    interests: ['writing'],
    isOnboarded: true,
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const mockWaitlist = [
  {
    user: {
      _id: '3' as any,
      email: 'bob@example.com',
      name: 'Bob Johnson',
      timezone: 'America/Chicago',
      interests: ['learning'],
      isOnboarded: true,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    joinedAt: new Date()
  }
]

describe('NoShowManager', () => {
  const onNoShowRecorded = vi.fn()
  const roomId = 'room123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        promotedUser: null
      })
    })
  })

  it('should render participant list', () => {
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Registered Participants')).toBeInTheDocument()
  })

  it('should render waitlist with count', () => {
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        waitlist={mockWaitlist}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    expect(screen.getByText('Waitlist (1)')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('should show empty state when no participants', () => {
    render(
      <NoShowManager
        roomId={roomId}
        participants={[]}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    expect(screen.getByText('No participants registered')).toBeInTheDocument()
  })

  it('should show no-show confirmation dialog', async () => {
    const user = userEvent.setup()
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    const noShowButton = screen.getByRole('button', { name: /mark no-show/i })
    await user.click(noShowButton)

    expect(screen.getByText('Mark No-Show?')).toBeInTheDocument()
    expect(screen.getByText(/john doe/i)).toBeInTheDocument()
  })

  it('should submit no-show with remarks', async () => {
    const user = userEvent.setup()
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    // Open dialog
    const noShowButton = screen.getByRole('button', { name: /mark no-show/i })
    await user.click(noShowButton)

    // Add remarks
    const remarksInput = screen.getByLabelText('Remarks (optional)')
    await user.type(remarksInput, 'Did not join')

    // Confirm
    const confirmButton = screen.getByRole('button', { name: /confirm no-show/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/admin/rooms/${roomId}/noshow`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Did not join')
        })
      )
    })
  })

  it('should show promoted user message', async () => {
    const user = userEvent.setup()
    const promotedUser = mockWaitlist[0].user

    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        promotedUser
      })
    })

    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        waitlist={mockWaitlist}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    // Mark no-show
    const noShowButton = screen.getByRole('button', { name: /mark no-show/i })
    await user.click(noShowButton)

    const confirmButton = screen.getByRole('button', { name: /confirm no-show/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText(/bob johnson promoted from waitlist/i)).toBeInTheDocument()
    })
  })

  it('should call onNoShowRecorded callback on success', async () => {
    const user = userEvent.setup()
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    const noShowButton = screen.getByRole('button', { name: /mark no-show/i })
    await user.click(noShowButton)

    const confirmButton = screen.getByRole('button', { name: /confirm no-show/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(onNoShowRecorded).toHaveBeenCalled()
    })
  })

  it('should show success toast on success', async () => {
    const user = userEvent.setup()
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    const noShowButton = screen.getByRole('button', { name: /mark no-show/i })
    await user.click(noShowButton)

    const confirmButton = screen.getByRole('button', { name: /confirm no-show/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
  })

  it('should show error toast on failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to record no-show' })
    })

    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    const noShowButton = screen.getByRole('button', { name: /mark no-show/i })
    await user.click(noShowButton)

    const confirmButton = screen.getByRole('button', { name: /confirm no-show/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to record no-show')
    })
  })

  it('should show warning about waitlist promotion', async () => {
    const user = userEvent.setup()
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        waitlist={mockWaitlist}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    const noShowButton = screen.getByRole('button', { name: /mark no-show/i })
    await user.click(noShowButton)

    await waitFor(() => {
      expect(screen.getByText(/if a waitlist exists, the first user will be promoted/i)).toBeInTheDocument()
    })
  })

  it('should close dialog when cancel clicked', async () => {
    const user = userEvent.setup()
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    const noShowButton = screen.getByRole('button', { name: /mark no-show/i })
    await user.click(noShowButton)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText('Mark No-Show?')).not.toBeInTheDocument()
    })
  })

  it('should display user photos', () => {
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    const images = screen.getAllByRole('img')
    expect(images[0]).toHaveAttribute('src', 'https://example.com/john.jpg')
    expect(images[0]).toHaveAttribute('alt', 'John Doe')
  })

  it('should display user initials when no photo', () => {
    const participantsWithoutPhoto = [mockParticipants[1]] // Jane has no photo
    render(
      <NoShowManager
        roomId={roomId}
        participants={participantsWithoutPhoto}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    expect(screen.getByText('J')).toBeInTheDocument()
  })

  it('should show waitlist position badges', () => {
    render(
      <NoShowManager
        roomId={roomId}
        participants={mockParticipants}
        waitlist={mockWaitlist}
        onNoShowRecorded={onNoShowRecorded}
      />
    )

    expect(screen.getByText('#1')).toBeInTheDocument()
  })
})
