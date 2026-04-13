import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ParticipantList } from '@/components/room/ParticipantList'
import { useRoomStore } from '@/store/roomStore'

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))

describe('ParticipantList', () => {
  beforeEach(() => {
    useRoomStore.getState().reset()
  })

  it('renders "No participants yet" when list is empty', () => {
    render(<ParticipantList />)
    expect(screen.getByText('No participants yet')).toBeInTheDocument()
  })

  it('displays participant count of zero when empty', () => {
    render(<ParticipantList />)
    expect(screen.getByText('Participants (0)')).toBeInTheDocument()
  })

  it('displays participant count when participants are present', () => {
    useRoomStore.setState({
      participants: [
        { userId: 'u1', userName: 'Alice' },
        { userId: 'u2', userName: 'Bob' },
      ],
      participantCount: 2,
    })

    render(<ParticipantList />)
    expect(screen.getByText('Participants (2)')).toBeInTheDocument()
  })

  it('displays participant names', () => {
    useRoomStore.setState({
      participants: [
        { userId: 'u1', userName: 'Alice' },
        { userId: 'u2', userName: 'Bob' },
      ],
      participantCount: 2,
    })

    render(<ParticipantList />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('shows fallback avatar initial when no photo', () => {
    useRoomStore.setState({
      participants: [{ userId: 'u1', userName: 'Carol' }],
      participantCount: 1,
    })

    render(<ParticipantList />)
    // Fallback shows first letter uppercased
    expect(screen.getByText('C')).toBeInTheDocument()
    // No img element should be present (no photo)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('shows participant photos when provided', () => {
    useRoomStore.setState({
      participants: [
        {
          userId: 'u1',
          userName: 'Dave',
          userPhoto: 'https://example.com/dave.jpg',
        },
      ],
      participantCount: 1,
    })

    render(<ParticipantList />)
    const img = screen.getByRole('img', { name: 'Dave' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/dave.jpg')
    expect(img).toHaveAttribute('alt', 'Dave')
  })

  it('does not render the empty state message when participants exist', () => {
    useRoomStore.setState({
      participants: [{ userId: 'u1', userName: 'Eve' }],
      participantCount: 1,
    })

    render(<ParticipantList />)
    expect(screen.queryByText('No participants yet')).not.toBeInTheDocument()
  })
})
