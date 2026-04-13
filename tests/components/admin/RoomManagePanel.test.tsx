import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { RoomManagePanel } from '@/components/admin/RoomManagePanel'
import { IRoom } from '@/models/types'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock fetch
global.fetch = vi.fn()

const mockRooms: IRoom[] = [
  {
    _id: '1' as any,
    title: 'Morning Focus Room',
    scheduledTime: new Date('2026-04-06T09:00:00'),
    duration: 45,
    capacity: 12,
    status: 'scheduled',
    participants: [] as any,
    waitlist: [],
    interestTags: ['coding', 'productivity'],
    isOverflowRoom: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2' as any,
    title: 'Afternoon Writing Session',
    scheduledTime: new Date('2026-04-06T14:00:00'),
    duration: 45,
    capacity: 12,
    status: 'open',
    participants: ['user1', 'user2'] as any,
    waitlist: [],
    interestTags: ['writing'],
    isOverflowRoom: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '3' as any,
    title: 'Full Room',
    scheduledTime: new Date('2026-04-06T16:00:00'),
    duration: 45,
    capacity: 12,
    status: 'full',
    participants: Array(12).fill('user') as any,
    waitlist: [],
    interestTags: [],
    isOverflowRoom: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

describe('RoomManagePanel', () => {
  const onRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    })
  })

  it('should render room table', () => {
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    expect(screen.getByText('Morning Focus Room')).toBeInTheDocument()
    expect(screen.getByText('Afternoon Writing Session')).toBeInTheDocument()
    expect(screen.getByText('Full Room')).toBeInTheDocument()
  })

  it('should show empty state when no rooms', () => {
    render(<RoomManagePanel rooms={[]} onRefresh={onRefresh} />)

    expect(screen.getByText('No rooms found')).toBeInTheDocument()
    expect(screen.getByText('Create a new room to get started')).toBeInTheDocument()
  })

  it('should sort rooms by scheduled time', () => {
    const unsortedRooms = [mockRooms[2], mockRooms[0], mockRooms[1]]
    render(<RoomManagePanel rooms={unsortedRooms} onRefresh={onRefresh} />)

    const rows = screen.getAllByRole('row')
    // Skip header row
    const firstRow = rows[1]
    expect(firstRow).toHaveTextContent('Morning Focus Room')
  })

  it('should filter rooms by status', async () => {
    const user = userEvent.setup()
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    // Click on "open" filter
    const openFilter = screen.getByRole('button', { name: 'open' })
    await user.click(openFilter)

    // Should only show open room
    expect(screen.getByText('Afternoon Writing Session')).toBeInTheDocument()
    expect(screen.queryByText('Morning Focus Room')).not.toBeInTheDocument()
  })

  it('should show all rooms when "all" filter selected', async () => {
    const user = userEvent.setup()
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    // Click on "scheduled" filter first
    const scheduledFilter = screen.getByRole('button', { name: 'scheduled' })
    await user.click(scheduledFilter)

    // Then click "all"
    const allFilter = screen.getByRole('button', { name: 'all' })
    await user.click(allFilter)

    // Should show all rooms
    expect(screen.getByText('Morning Focus Room')).toBeInTheDocument()
    expect(screen.getByText('Afternoon Writing Session')).toBeInTheDocument()
    expect(screen.getByText('Full Room')).toBeInTheDocument()
  })

  it('should open edit dialog when edit button clicked', async () => {
    const user = userEvent.setup()
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    const editButtons = screen.getAllByRole('button', { name: '' })
      .filter(btn => btn.querySelector('svg'))
    await user.click(editButtons[0])

    expect(screen.getByText('Edit Room')).toBeInTheDocument()
    expect(screen.getByText(/update room details/i)).toBeInTheDocument()
  })

  it('should open cancel dialog when cancel button clicked', async () => {
    const user = userEvent.setup()
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    // Find cancel buttons (X icon buttons)
    const cancelButton = screen.getAllByRole('button').find(btn =>
      btn.innerHTML.includes('xmlns') && btn.querySelector('svg')
    )

    if (cancelButton) {
      await user.click(cancelButton)

      expect(screen.getByText('Cancel Room?')).toBeInTheDocument()
      expect(screen.getByText(/are you sure you want to cancel/i)).toBeInTheDocument()
    }
  })

  it('should handle room update', async () => {
    const user = userEvent.setup()
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    // Open edit dialog
    const editButtons = screen.getAllByRole('button')
    await user.click(editButtons[0])

    // Change title
    const titleInput = screen.getByLabelText('Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Updated Room Title')

    // Submit
    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/rooms/1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('Updated Room Title')
        })
      )
    })
  })

  it('should show success toast on room update', async () => {
    const user = userEvent.setup()
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    // Open and submit edit dialog
    const editButtons = screen.getAllByRole('button')
    await user.click(editButtons[0])

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Room updated successfully')
    })
  })

  it('should handle room cancellation', async () => {
    const user = userEvent.setup()
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    // Find and click cancel button
    const buttons = screen.getAllByRole('button')
    const cancelButton = buttons.find(btn => btn.querySelector('svg'))

    if (cancelButton) {
      await user.click(cancelButton)

      // Confirm cancellation
      const confirmButton = screen.getByRole('button', { name: /yes, cancel room/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/rooms/1',
          expect.objectContaining({
            method: 'DELETE'
          })
        )
      })
    }
  })

  it('should show error toast on update failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to update room' })
    })

    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    // Open and submit edit dialog
    const editButtons = screen.getAllByRole('button')
    await user.click(editButtons[0])

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to update room')
    })
  })

  it('should disable edit for completed rooms', () => {
    const completedRoom: IRoom = {
      ...mockRooms[0],
      status: 'completed',
      _id: '4' as any
    }

    render(<RoomManagePanel rooms={[completedRoom]} onRefresh={onRefresh} />)

    // Edit button should be disabled for completed room
    const editButton = screen.getByRole('button')
    expect(editButton).toBeDisabled()
  })

  it('should disable cancel for cancelled rooms', () => {
    const cancelledRoom: IRoom = {
      ...mockRooms[0],
      status: 'cancelled',
      _id: '5' as any
    }

    render(<RoomManagePanel rooms={[cancelledRoom]} onRefresh={onRefresh} />)

    // Cancel button should be disabled for cancelled room
    const cancelButton = screen.getByRole('button')
    expect(cancelButton).toBeDisabled()
  })

  it('should display participant count', () => {
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    expect(screen.getByText('2 / 12')).toBeInTheDocument()
  })

  it('should display interest tags', () => {
    render(<RoomManagePanel rooms={mockRooms} onRefresh={onRefresh} />)

    expect(screen.getByText('#coding #productivity')).toBeInTheDocument()
    expect(screen.getByText('#writing')).toBeInTheDocument()
  })
})
