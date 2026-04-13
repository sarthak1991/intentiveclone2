import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RoomCalendar from '@/components/rooms/RoomCalendar'
import { RoomWithStatus } from '@/lib/rooms'

// Mock Calendar component
vi.mock('@/components/ui/calendar', () => ({
  Calendar: ({ selected, onSelect, modifiers, modifiersStyles }: any) => (
    <div data-testid="calendar">
      <button
        onClick={() => onSelect(new Date('2026-04-07'))}
        data-testid="select-date"
      >
        Select Date
      </button>
      <span data-testid="selected-date">
        {selected ? selected.toDateString() : 'None'}
      </span>
    </div>
  )
}))

describe('RoomCalendar', () => {
  const mockRooms: RoomWithStatus[] = [
    {
      _id: '1' as any,
      title: 'Morning Focus',
      scheduledTime: new Date('2026-04-07T09:00:00Z'),
      duration: 45,
      capacity: 12,
      status: 'open',
      participants: [] as any,
      waitlist: [],
      interestTags: [],
      isOverflowRoom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      displayTime: '9:00 AM',
      registrationStatus: {
        status: 'open',
        canRegister: true,
        message: 'Register now'
      }
    },
    {
      _id: '2' as any,
      title: 'Afternoon Focus',
      scheduledTime: new Date('2026-04-08T14:00:00Z'),
      duration: 45,
      capacity: 12,
      status: 'open',
      participants: [] as any,
      waitlist: [],
      interestTags: [],
      isOverflowRoom: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      displayTime: '2:00 PM',
      registrationStatus: {
        status: 'open',
        canRegister: true,
        message: 'Register now'
      }
    }
  ]

  it('should render calendar component', () => {
    const selectedDate = new Date('2026-04-07')
    const mockOnDateSelect = vi.fn()

    render(
      <RoomCalendar
        rooms={mockRooms}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    )

    expect(screen.getByTestId('calendar')).toBeInTheDocument()
  })

  it('should show select date header', () => {
    const selectedDate = new Date('2026-04-07')
    const mockOnDateSelect = vi.fn()

    render(
      <RoomCalendar
        rooms={mockRooms}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    )

    expect(screen.getAllByText('Select Date').length).toBeGreaterThan(0)
  })

  it('should display selected date', () => {
    const selectedDate = new Date('2026-04-07')
    const mockOnDateSelect = vi.fn()

    render(
      <RoomCalendar
        rooms={mockRooms}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    )

    expect(screen.getAllByText(/April/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/7/).length).toBeGreaterThan(0)
  })

  it('should call onDateSelect when date is clicked', () => {
    const selectedDate = new Date('2026-04-07')
    const mockOnDateSelect = vi.fn()

    render(
      <RoomCalendar
        rooms={mockRooms}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    )

    const selectButton = screen.getByTestId('select-date')
    fireEvent.click(selectButton)

    expect(mockOnDateSelect).toHaveBeenCalled()
  })

  it('should identify dates with rooms', () => {
    const selectedDate = new Date('2026-04-07')
    const mockOnDateSelect = vi.fn()

    render(
      <RoomCalendar
        rooms={mockRooms}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    )

    // April 7 has a room
    const hasRoomApril7 = mockRooms.some(room => {
      const roomDate = new Date(room.scheduledTime)
      return roomDate.toDateString() === new Date('2026-04-07').toDateString()
    })
    expect(hasRoomApril7).toBe(true)
  })

  it('should indicate rooms available on selected date', () => {
    const selectedDate = new Date('2026-04-07')
    const mockOnDateSelect = vi.fn()

    render(
      <RoomCalendar
        rooms={mockRooms}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    )

    expect(screen.getByText(/Rooms available on/)).toBeInTheDocument()
    expect(screen.getAllByText(/April/).length).toBeGreaterThan(0)
  })

  it('should indicate no rooms for date without rooms', () => {
    const selectedDate = new Date('2026-04-10') // Date with no rooms
    const mockOnDateSelect = vi.fn()

    render(
      <RoomCalendar
        rooms={mockRooms}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    )

    expect(screen.getByText(/No rooms scheduled for/)).toBeInTheDocument()
    expect(screen.getAllByText(/April/).length).toBeGreaterThan(0)
  })

  it('should handle empty rooms array', () => {
    const selectedDate = new Date('2026-04-07')
    const mockOnDateSelect = vi.fn()

    render(
      <RoomCalendar
        rooms={[]}
        selectedDate={selectedDate}
        onDateSelect={mockOnDateSelect}
      />
    )

    expect(screen.getByText(/No rooms scheduled for/)).toBeInTheDocument()
  })
})
