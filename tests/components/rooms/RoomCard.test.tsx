import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RoomCard from '@/components/rooms/RoomCard'
import { RoomWithStatus } from '@/lib/rooms'
import { IRoom } from '@/models/types'

// Mock child components to avoid complex setup
vi.mock('@/components/rooms/RegisterButton', () => ({
  default: ({ roomId, registrationStatus }: any) => (
    <div data-testid="register-button">
      <span data-testid="room-id">{roomId}</span>
      <span data-testid="reg-status">{registrationStatus?.status}</span>
    </div>
  )
}))

vi.mock('@/components/rooms/JoinRoomButton', () => ({
  default: ({ roomId, isRegistered }: any) => (
    <div data-testid="join-button">
      <span data-testid="room-id">{roomId}</span>
      <span data-testid="is-registered">{isRegistered.toString()}</span>
    </div>
  )
}))

describe('RoomCard', () => {
  const mockRoom: RoomWithStatus = {
    _id: '123' as any,
    title: 'Focus Room',
    scheduledTime: new Date('2026-04-07T09:00:00Z'),
    duration: 45,
    capacity: 12,
    status: 'open',
    participants: [] as any,
    waitlist: [],
    interestTags: ['coding', 'productivity'],
    isOverflowRoom: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    displayTime: '9:00 AM',
    registrationStatus: {
      status: 'open',
      canRegister: true,
      message: 'Register now'
    }
  }

  it('should render room title and time', () => {
    render(<RoomCard room={mockRoom} userTimezone="America/New_York" />)

    expect(screen.getAllByText('Focus Room').length).toBeGreaterThan(0)
    expect(screen.getByText('9:00 AM')).toBeInTheDocument()
  })

  it('should display participant count', () => {
    const roomWithParticipants: RoomWithStatus = {
      ...mockRoom,
      participants: ['1', '2', '3'] as any
    }

    render(<RoomCard room={roomWithParticipants} userTimezone="America/New_York" />)

    expect(screen.getByText('3 / 12 participants')).toBeInTheDocument()
  })

  it('should show status badge', () => {
    render(<RoomCard room={mockRoom} userTimezone="America/New_York" />)

    expect(screen.getByText('Open')).toBeInTheDocument()
  })

  it('should show different status for full room', () => {
    const fullRoom: RoomWithStatus = {
      ...mockRoom,
      status: 'full'
    }

    render(<RoomCard room={fullRoom} userTimezone="America/New_York" />)

    expect(screen.getByText('Full')).toBeInTheDocument()
  })

  it('should show interest tags', () => {
    render(<RoomCard room={mockRoom} userTimezone="America/New_York" />)

    expect(screen.getByText('coding')).toBeInTheDocument()
    expect(screen.getByText('productivity')).toBeInTheDocument()
  })

  it('should truncate interest tags if more than 3', () => {
    const roomWithManyTags: RoomWithStatus = {
      ...mockRoom,
      interestTags: ['coding', 'productivity', 'writing', 'design', 'music']
    }

    render(<RoomCard room={roomWithManyTags} userTimezone="America/New_York" />)

    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('should render RegisterButton', () => {
    render(<RoomCard room={mockRoom} userTimezone="America/New_York" />)

    expect(screen.getByTestId('register-button')).toBeInTheDocument()
  })

  it('should render JoinRoomButton when registered', () => {
    render(<RoomCard room={mockRoom} userTimezone="America/New_York" isRegistered={true} />)

    expect(screen.getByTestId('join-button')).toBeInTheDocument()
  })

  it('should handle missing room data gracefully', () => {
    const { container } = render(<RoomCard room={null as any} userTimezone="America/New_York" />)

    expect(container.firstChild).toBeNull()
  })

  it('should show timezone next to time', () => {
    render(<RoomCard room={mockRoom} userTimezone="America/New_York" />)

    expect(screen.getByText('(America/New_York)')).toBeInTheDocument()
  })

  it('should display default title if missing', () => {
    const roomWithoutTitle: RoomWithStatus = {
      ...mockRoom,
      title: ''
    }

    render(<RoomCard room={roomWithoutTitle} userTimezone="America/New_York" />)

    expect(screen.getAllByText('Focus Room').length).toBeGreaterThan(0)
  })

  it('should display default displayTime if missing', () => {
    const roomWithoutDisplayTime: RoomWithStatus = {
      ...mockRoom,
      displayTime: undefined
    }

    render(<RoomCard room={roomWithoutDisplayTime} userTimezone="America/New_York" />)

    expect(screen.getByText('Time not available')).toBeInTheDocument()
  })
})
