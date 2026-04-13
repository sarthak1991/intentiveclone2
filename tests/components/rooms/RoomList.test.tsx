import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RoomList from '@/components/rooms/RoomList'
import { RoomWithStatus } from '@/lib/rooms'

// Mock RoomCard component
vi.mock('@/components/rooms/RoomCard', () => ({
  default: ({ room, userTimezone }: any) => (
    <div data-testid="room-card">
      <span data-testid="room-id">{room._id.toString()}</span>
      <span data-testid="timezone">{userTimezone}</span>
    </div>
  )
}))

describe('RoomList', () => {
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
      scheduledTime: new Date('2026-04-07T14:00:00Z'),
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

  it('should render room cards for each room', () => {
    render(<RoomList rooms={mockRooms} userTimezone="America/New_York" />)

    const roomCards = screen.getAllByTestId('room-card')
    expect(roomCards).toHaveLength(2)
    expect(screen.getByText('2 rooms available')).toBeInTheDocument()
  })

  it('should show empty state when no rooms', () => {
    render(<RoomList rooms={[]} userTimezone="America/New_York" />)

    expect(screen.getByText('No rooms scheduled')).toBeInTheDocument()
    expect(screen.getByText(/There are no focus rooms scheduled/)).toBeInTheDocument()
  })

  it('should show loading state while fetching', () => {
    render(<RoomList rooms={[]} userTimezone="America/New_York" isLoading={true} />)

    expect(screen.getByText('Loading rooms...')).toBeInTheDocument()
  })

  it('should display room count', () => {
    render(<RoomList rooms={mockRooms} userTimezone="America/New_York" />)

    expect(screen.getByText('2 rooms available')).toBeInTheDocument()
  })

  it('should display singular form for single room', () => {
    const singleRoom = [mockRooms[0]]

    render(<RoomList rooms={singleRoom} userTimezone="America/New_York" />)

    expect(screen.getByText('1 room available')).toBeInTheDocument()
  })

  it('should pass user timezone to room cards', () => {
    render(<RoomList rooms={mockRooms} userTimezone="Asia/Kolkata" />)

    const timezones = screen.getAllByTestId('timezone')
    expect(timezones[0]).toHaveTextContent('Asia/Kolkata')
  })

  it('should show Today\'s Focus Rooms header', () => {
    render(<RoomList rooms={mockRooms} userTimezone="America/New_York" />)

    expect(screen.getByText("Today's Focus Rooms")).toBeInTheDocument()
  })

  it('should suggest checking another date in empty state', () => {
    render(<RoomList rooms={[]} userTimezone="America/New_York" />)

    expect(screen.getByText(/Try selecting a different date/)).toBeInTheDocument()
  })

  it('should handle null rooms gracefully', () => {
    const { container } = render(
      <RoomList rooms={null as any} userTimezone="America/New_York" />
    )

    expect(screen.getByText('No rooms scheduled')).toBeInTheDocument()
  })

  it('should display loading spinner', () => {
    render(<RoomList rooms={[]} userTimezone="America/New_York" isLoading={true} />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })
})
