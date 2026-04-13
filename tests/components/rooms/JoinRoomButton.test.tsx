import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import JoinRoomButton from '@/components/rooms/JoinRoomButton'
import { useRouter } from 'next/navigation'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  Link: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}))

describe('JoinRoomButton', () => {
  const mockRoomId = 'room-123'

  it('should render Link to room page', () => {
    render(<JoinRoomButton roomId={mockRoomId} isRegistered={true} />)

    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/room/room-123')
  })

  it('should show join room button text', () => {
    render(<JoinRoomButton roomId={mockRoomId} isRegistered={true} />)

    expect(screen.getByText('Join Room')).toBeInTheDocument()
  })

  it('should be enabled when registered', () => {
    const { container } = render(
      <JoinRoomButton roomId={mockRoomId} isRegistered={true} />
    )

    const button = container.querySelector('button')
    expect(button).toBeInTheDocument()
    // Button should not have disabled attribute
    expect(button?.getAttribute('disabled')).toBeNull()
  })

  it('should not render when not registered', () => {
    const { container } = render(
      <JoinRoomButton roomId={mockRoomId} isRegistered={false} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should have correct accessibility label', () => {
    render(<JoinRoomButton roomId={mockRoomId} isRegistered={true} />)

    const button = screen.getByRole('button')
    expect(button.getAttribute('aria-label')).toBe('Join room')
  })

  it('should render arrow icon', () => {
    const { container } = render(
      <JoinRoomButton roomId={mockRoomId} isRegistered={true} />
    )

    // Check if SVG icon is present
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
