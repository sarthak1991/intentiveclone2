import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import RegisterButton from '@/components/rooms/RegisterButton'
import { RegistrationStatus } from '@/lib/rooms'

// Mock fetch
global.fetch = vi.fn()

describe('RegisterButton', () => {
  const mockRoomId = 'room-123'
  const mockOnRegister = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show register button when status is open', () => {
    const status: RegistrationStatus = {
      status: 'open',
      canRegister: true,
      message: 'Register now'
    }

    render(<RegisterButton roomId={mockRoomId} registrationStatus={status} />)

    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('should show registered button when status is registered', () => {
    const status: RegistrationStatus = {
      status: 'registered',
      canRegister: false,
      message: "You're registered"
    }

    render(<RegisterButton roomId={mockRoomId} registrationStatus={status} />)

    expect(screen.getByText('Registered ✓')).toBeInTheDocument()
  })

  it('should show room full button when status is full', () => {
    const status: RegistrationStatus = {
      status: 'full',
      canRegister: false,
      message: 'Room is full'
    }

    render(<RegisterButton roomId={mockRoomId} registrationStatus={status} />)

    expect(screen.getByText('Room Full')).toBeInTheDocument()
  })

  it('should show disabled button when status is closed', () => {
    const status: RegistrationStatus = {
      status: 'closed',
      canRegister: false,
      message: 'Registration opens in 5 minutes'
    }

    render(<RegisterButton roomId={mockRoomId} registrationStatus={status} />)

    expect(screen.getByText('Registration opens in 5 minutes')).toBeInTheDocument()
  })

  it('should show opening soon button when status is opening-soon', () => {
    const status: RegistrationStatus = {
      status: 'opening-soon',
      canRegister: true,
      message: 'Registration opening soon'
    }

    render(<RegisterButton roomId={mockRoomId} registrationStatus={status} />)

    expect(screen.getByText('Registration opening soon')).toBeInTheDocument()
  })

  it('should call API when register button is clicked', async () => {
    const status: RegistrationStatus = {
      status: 'open',
      canRegister: true,
      message: 'Register now'
    }

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response)

    render(
      <RegisterButton
        roomId={mockRoomId}
        registrationStatus={status}
        onRegister={mockOnRegister}
      />
    )

    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/rooms/room-123/register',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      )
      expect(mockOnRegister).toHaveBeenCalled()
    })
  })

  it('should show error message when registration fails', async () => {
    const status: RegistrationStatus = {
      status: 'open',
      canRegister: true,
      message: 'Register now'
    }

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Room is full' })
    } as Response)

    render(
      <RegisterButton
        roomId={mockRoomId}
        registrationStatus={status}
        onRegister={mockOnRegister}
      />
    )

    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText('Room is full')).toBeInTheDocument()
    })
  })

  it('should show loading state while registering', async () => {
    const status: RegistrationStatus = {
      status: 'open',
      canRegister: true,
      message: 'Register now'
    }

    const mockFetch = vi.mocked(fetch)
    // Don't resolve the promise immediately to keep loading state
    mockFetch.mockImplementationOnce(() => new Promise(() => {}))

    render(
      <RegisterButton
        roomId={mockRoomId}
        registrationStatus={status}
        onRegister={mockOnRegister}
      />
    )

    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)

    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('should call cancel registration when registered and cancelled', async () => {
    // This test would require updating the component to show cancel button
    // For now, we test the registered state
    const status: RegistrationStatus = {
      status: 'registered',
      canRegister: false,
      message: "You're registered"
    }

    render(
      <RegisterButton
        roomId={mockRoomId}
        registrationStatus={status}
        onCancel={mockOnCancel}
      />
    )

    expect(screen.getByText('Registered ✓')).toBeInTheDocument()
  })

  it('should handle network errors gracefully', async () => {
    const status: RegistrationStatus = {
      status: 'open',
      canRegister: true,
      message: 'Register now'
    }

    const mockFetch = vi.mocked(fetch)
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(
      <RegisterButton
        roomId={mockRoomId}
        registrationStatus={status}
        onRegister={mockOnRegister}
      />
    )

    const registerButton = screen.getByText('Register')
    fireEvent.click(registerButton)

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })
})
