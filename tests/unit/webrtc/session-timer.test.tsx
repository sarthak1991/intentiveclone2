/**
 * Unit tests for SessionTimer component
 *
 * Tests 45-minute countdown timer for focus room sessions.
 * Covers ROOM-06 requirement: User can see visible 45-minute session countdown timer.
 */

import { render, screen } from '@testing-library/react'
import { SessionTimer } from '@/components/room/SessionTimer'

describe('SessionTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('countdown display', () => {
    it('should display initial time correctly', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={45} />)

      expect(screen.getByText('45:00 remaining')).toBeInTheDocument()
    })

    it('should count down every second', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={45} />)

      // Initial state
      expect(screen.getByText('45:00 remaining')).toBeInTheDocument()

      // Advance 1 second
      vi.advanceTimersByTime(1000)

      // Timer updates
      expect(screen.getByText('44:59 remaining')).toBeInTheDocument()
    })

    it('should reach 0:00 after duration expires', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={45} />)

      // Advance 45 minutes
      vi.advanceTimersByTime(45 * 60 * 1000)

      expect(screen.getByText('0:00 remaining')).toBeInTheDocument()
    })

    it('should handle 30-minute session', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={30} />)

      expect(screen.getByText('30:00 remaining')).toBeInTheDocument()

      vi.advanceTimersByTime(30 * 60 * 1000)

      expect(screen.getByText('0:00 remaining')).toBeInTheDocument()
    })
  })

  describe('formatTime function', () => {
    it('should format seconds with leading zeros', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={1} />)

      expect(screen.getByText('1:00 remaining')).toBeInTheDocument()

      vi.advanceTimersByTime(59 * 1000)

      expect(screen.getByText('0:01 remaining')).toBeInTheDocument()
    })

    it('should handle 0 seconds', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={0} />)

      expect(screen.getByText('0:00 remaining')).toBeInTheDocument()
    })

    it('should handle 59 seconds', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={1} />)

      vi.advanceTimersByTime(1 * 1000)

      expect(screen.getByText('0:59 remaining')).toBeInTheDocument()
    })

    it('should handle times over 60 minutes', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={90} />)

      expect(screen.getByText('90:00 remaining')).toBeInTheDocument()
    })
  })

  describe('cleanup on unmount', () => {
    it('should clear interval on unmount', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      const { unmount } = render(<SessionTimer startTime={startTime} durationMinutes={45} />)

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('styling per D-10', () => {
    it('should apply text-accent class', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      const { container } = render(<SessionTimer startTime={startTime} durationMinutes={45} />)

      const timer = container.querySelector('.text-accent')
      expect(timer).toBeInTheDocument()
    })

    it('should not change color throughout countdown', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      const { container } = render(<SessionTimer startTime={startTime} durationMinutes={45} />)

      // Initial color
      let timer = container.querySelector('.text-accent')
      expect(timer).toBeInTheDocument()

      // Advance to near end
      vi.advanceTimersByTime(44 * 60 * 1000)

      // Should still have same class (no color change)
      timer = container.querySelector('.text-accent')
      expect(timer).toBeInTheDocument()

      // Should not have warning/danger classes
      const dangerClass = container.querySelector('.text-red-500')
      expect(dangerClass).not.toBeInTheDocument()
    })
  })

  describe('time calculation', () => {
    it('should calculate remaining time correctly from ISO string', () => {
      const startTime = '2025-04-07T09:00:00Z'

      render(<SessionTimer startTime={startTime} durationMinutes={45} />)

      expect(screen.getByText('45:00 remaining')).toBeInTheDocument()
    })

    it('should calculate remaining time correctly from Date object', () => {
      const startTime = new Date('2025-04-07T09:00:00Z')

      render(<SessionTimer startTime={startTime} durationMinutes={45} />)

      expect(screen.getByText('45:00 remaining')).toBeInTheDocument()
    })

    it('should handle session that started in the past', () => {
      // Session started 10 minutes ago
      const pastStartTime = new Date(Date.now() - 10 * 60 * 1000)

      render(<SessionTimer startTime={pastStartTime} durationMinutes={45} />)

      // Should show 35 minutes remaining
      expect(screen.getByText('35:00 remaining')).toBeInTheDocument()
    })
  })
})
