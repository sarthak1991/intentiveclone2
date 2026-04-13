/**
 * Unit tests for VideoGrid component
 *
 * Tests auto-responsive grid layout for 1-12 participants.
 * Covers VIDE-04 requirement: User sees participant names and photos in video grid.
 */

import { render, screen } from '@testing-library/react'
import { VideoGrid } from '@/components/room/VideoGrid'

// Mock VideoCard component
vi.mock('@/components/room/VideoCard', () => ({
  VideoCard: ({ participant, isActiveSpeaker }: any) => (
    <div data-testid={`video-card-${participant.userId}`}>
      <span>{participant.userName}</span>
      {isActiveSpeaker && <span data-testid="active-speaker-border" />}
    </div>
  ),
}))

describe('VideoGrid', () => {
  const mockParticipants = [
    {
      userId: 'user-1',
      userName: 'Alice',
      userPhoto: null,
    },
    {
      userId: 'user-2',
      userName: 'Bob',
      userPhoto: null,
    },
  ]

  beforeEach(() => {
    // Mock roomStore module
    vi.doMock('@/store/roomStore', () => ({
      useRoomStore: vi.fn((selector) => {
        const state = {
          roomId: 'room-1',
          participants: [],
          participantCount: 0,
          messages: [],
          isConnected: false,
          isMuted: false,
          isVideoOff: false,
          activeSpeakerId: null,
          producers: new Map(),
          consumers: new Map(),
          attendedSessions: new Set(),
          setRoomId: vi.fn(),
          addParticipant: vi.fn(),
          removeParticipant: vi.fn(),
          setParticipants: vi.fn(),
          addMessage: vi.fn(),
          setMessages: vi.fn(),
          setConnected: vi.fn(),
          setMuted: vi.fn(),
          setVideoOff: vi.fn(),
          setActiveSpeakerId: vi.fn(),
          addProducer: vi.fn(),
          addConsumer: vi.fn(),
          removeConsumer: vi.fn(),
          setAttendedSession: vi.fn(),
          reset: vi.fn(),
        }
        return selector ? selector(state) : state
      }),
    }))

    vi.clearAllMocks()
  })

  describe('grid layout variations', () => {
    it('should render full-width rows for 1 participant', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: [mockParticipants[0]],
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      const { container } = render(<VideoGrid />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('should render 2x3 grid for 4 participants', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      const fourParticipants = [
        mockParticipants[0],
        mockParticipants[1],
        { ...mockParticipants[0], userId: 'user-3', userName: 'Charlie' },
        { ...mockParticipants[0], userId: 'user-4', userName: 'Diana' },
      ]

      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: fourParticipants,
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      const { container } = render(<VideoGrid />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-2')
    })

    it('should render 3x3 grid for 9 participants', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      const nineParticipants = Array.from({ length: 9 }, (_, i) => ({
        ...mockParticipants[0],
        userId: `user-${i + 1}`,
        userName: `User ${i + 1}`,
      }))

      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: nineParticipants,
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      const { container } = render(<VideoGrid />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-3')
    })

    it('should render 3x4 grid for 12 participants', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      const twelveParticipants = Array.from({ length: 12 }, (_, i) => ({
        ...mockParticipants[0],
        userId: `user-${i + 1}`,
        userName: `User ${i + 1}`,
      }))

      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: twelveParticipants,
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      const { container } = render(<VideoGrid />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-3', 'lg:grid-cols-4')
    })
  })

  describe('empty state', () => {
    it('should show waiting message when no participants', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: [],
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      render(<VideoGrid />)

      expect(screen.getByText('Waiting for others to join...')).toBeInTheDocument()
      expect(
        screen.getByText("You'll see participants here when they arrive")
      ).toBeInTheDocument()
    })

    it('should show Users icon in empty state', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: [],
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      const { container } = render(<VideoGrid />)

      // Check for SVG icon (lucide-react Users component)
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('VideoCard rendering', () => {
    it('should render VideoCard for each participant', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: mockParticipants,
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      render(<VideoGrid />)

      expect(screen.getByTestId('video-card-user-1')).toBeInTheDocument()
      expect(screen.getByTestId('video-card-user-2')).toBeInTheDocument()
    })

    it('should pass participant data to VideoCard', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: mockParticipants,
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      render(<VideoGrid />)

      expect(screen.getByText('Alice')).toBeInTheDocument()
      expect(screen.getByText('Bob')).toBeInTheDocument()
    })

    it('should highlight active speaker with border', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: mockParticipants,
          activeSpeakerId: 'user-1',
        }
        return selector ? selector(state) : state
      })

      render(<VideoGrid />)

      const activeSpeakerCard = screen.getByTestId('video-card-user-1')
      expect(activeSpeakerCard.querySelector('[data-testid="active-speaker-border"]')).toBeInTheDocument()

      const otherCard = screen.getByTestId('video-card-user-2')
      expect(otherCard.querySelector('[data-testid="active-speaker-border"]')).not.toBeInTheDocument()
    })

    it('should not highlight any speaker when activeSpeakerId is null', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: mockParticipants,
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      render(<VideoGrid />)

      expect(screen.queryByTestId('active-speaker-border')).not.toBeInTheDocument()
    })
  })

  describe('grid container styling', () => {
    it('should apply gap-4 and p-4 classes', async () => {
      const { useRoomStore } = await import('@/store/roomStore')
      vi.mocked(useRoomStore).mockImplementation((selector) => {
        const state = {
          participants: mockParticipants,
          activeSpeakerId: null,
        }
        return selector ? selector(state) : state
      })

      const { container } = render(<VideoGrid />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('gap-4', 'p-4')
    })
  })
})
