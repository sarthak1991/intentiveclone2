import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StepNamePhoto } from '@/components/onboarding/StepNamePhoto'
import { StepTimezone } from '@/components/onboarding/StepTimezone'
import { StepInterests } from '@/components/onboarding/StepInterests'
import { StepWelcome } from '@/components/onboarding/StepWelcome'
import { useOnboardingStore } from '@/lib/onboarding-store'

describe('Onboarding Step Components', () => {
  beforeEach(() => {
    // Reset store before each test
    useOnboardingStore.getState().reset()
  })

  describe('StepNamePhoto', () => {
    it('should render name input and photo upload', () => {
      render(<StepNamePhoto />)

      expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Profile Photo/i)).toBeInTheDocument()
    })

    it('should update name in store', () => {
      render(<StepNamePhoto />)

      const nameInput = screen.getByLabelText(/Your Name/i)
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })

      expect(useOnboardingStore.getState().data.name).toBe('John Doe')
    })

    it('should show heading and description', () => {
      render(<StepNamePhoto />)

      expect(screen.getByText(/Welcome! Let's get you set up/i)).toBeInTheDocument()
      expect(screen.getByText(/what should we call you/i)).toBeInTheDocument()
    })
  })

  describe('StepTimezone', () => {
    it('should render timezone dropdown', () => {
      render(<StepTimezone />)

      expect(screen.getByLabelText(/Timezone/i)).toBeInTheDocument()
    })

    it('should auto-detect timezone from browser', async () => {
      render(<StepTimezone />)

      await waitFor(() => {
        const state = useOnboardingStore.getState()
        expect(state.data.timezone).toBeTruthy()
      })
    })

    it('should update timezone in store', () => {
      render(<StepTimezone />)

      const timezoneSelect = screen.getByLabelText(/Timezone/i)
      fireEvent.change(timezoneSelect, { target: { value: 'America/New_York' } })

      expect(useOnboardingStore.getState().data.timezone).toBe('America/New_York')
    })

    it('should show common timezones', () => {
      render(<StepTimezone />)

      expect(screen.getByText('America/New_York')).toBeInTheDocument()
      expect(screen.getByText('Europe/London')).toBeInTheDocument()
      expect(screen.getByText('Asia/Kolkata')).toBeInTheDocument()
    })
  })

  describe('StepInterests', () => {
    it('should render interest categories', () => {
      render(<StepInterests />)

      expect(screen.getByText(/Occupation/i)).toBeInTheDocument()
      expect(screen.getByText(/Goals/i)).toBeInTheDocument()
      expect(screen.getByText(/Expertise Level/i)).toBeInTheDocument()
    })

    it('should toggle interest tags', () => {
      render(<StepInterests />)

      const developerTag = screen.getByText('Developer')
      fireEvent.click(developerTag)

      expect(useOnboardingStore.getState().data.interests).toContain('Developer')

      fireEvent.click(developerTag)
      expect(useOnboardingStore.getState().data.interests).not.toContain('Developer')
    })

    it('should show selected count', () => {
      render(<StepInterests />)

      const developerTag = screen.getByText('Developer')
      fireEvent.click(developerTag)

      const writerTag = screen.getByText('Writer')
      fireEvent.click(writerTag)

      expect(screen.getByText(/You selected 2 tags/i)).toBeInTheDocument()
    })

    it('should show heading and description', () => {
      render(<StepInterests />)

      expect(screen.getByText(/Your Interests/i)).toBeInTheDocument()
      expect(screen.getByText(/Select tags that describe you/i)).toBeInTheDocument()
    })
  })

  describe('StepWelcome', () => {
    it('should render welcome message', () => {
      render(<StepWelcome />)

      expect(screen.getByText(/You're all set/i)).toBeInTheDocument()
      expect(screen.getByText(/Welcome to FocusFlow/i)).toBeInTheDocument()
    })

    it('should show what happens next section', () => {
      render(<StepWelcome />)

      expect(screen.getByText(/What happens next\?/i)).toBeInTheDocument()
      expect(screen.getByText(/Browse upcoming focus rooms/i)).toBeInTheDocument()
      expect(screen.getByText(/Join a room/i)).toBeInTheDocument()
    })

    it('should have "How it works" link', () => {
      render(<StepWelcome />)

      const link = screen.getByText(/How it works/i)
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/how-it-works')
    })
  })
})
