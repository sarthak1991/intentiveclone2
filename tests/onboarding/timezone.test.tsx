import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StepTimezone } from '@/components/onboarding/StepTimezone'
import { useOnboardingStore } from '@/lib/onboarding-store'

// Mock the onboarding store
vi.mock('@/lib/onboarding-store')

describe('StepTimezone - Timezone Detection and Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock Intl.DateTimeFormat
    const originalDateTimeFormat = Intl.DateTimeFormat
    vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      return {
        ...new originalDateTimeFormat(),
        resolvedOptions: () => ({
          locale: 'en-US',
          calendar: 'gregory',
          numberingSystem: 'latn',
          timeZone: 'America/New_York'
        })
      } as any
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Timezone Auto-detection', () => {
    it('should auto-detect timezone on mount', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: null },
        updateData
      })

      render(<StepTimezone />)

      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ timezone: 'America/New_York' })
      })
    })

    it('should not override existing timezone', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'Asia/Kolkata' },
        updateData
      })

      render(<StepTimezone />)

      // Should not call updateData since timezone already exists
      expect(updateData).not.toHaveBeenCalled()
    })

    it('should display detected timezone in dropdown', async () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: null },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      await waitFor(() => {
        const select = screen.getByLabelText(/timezone/i) as HTMLSelectElement
        expect(select.value).toBe('America/New_York')
      })
    })

    it('should handle timezone detection failure gracefully', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: null },
        updateData
      })

      // Mock Intl.DateTimeFormat to throw error
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
        throw new Error('Timezone detection failed')
      })

      render(<StepTimezone />)

      await waitFor(() => {
        // Should fallback to UTC
        expect(updateData).toHaveBeenCalledWith({ timezone: 'UTC' })
      })

      vi.restoreAllMocks()
    })

    it('should show "(detected)" label for auto-detected timezone', async () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: null },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      await waitFor(() => {
        expect(screen.getByText(/America\/New_York \(detected\)/i)).toBeInTheDocument()
      })
    })
  })

  describe('Timezone Selection', () => {
    it('should render timezone dropdown', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument()
    })

    it('should display common timezones', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByText(/UTC/i)).toBeInTheDocument()
      expect(screen.getByText(/America\/New_York/i)).toBeInTheDocument()
      expect(screen.getByText(/Europe\/London/i)).toBeInTheDocument()
      expect(screen.getByText(/Asia\/Kolkata/i)).toBeInTheDocument()
    })

    it('should allow manual timezone selection', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData
      })

      render(<StepTimezone />)

      const select = screen.getByLabelText(/timezone/i)
      fireEvent.change(select, { target: { value: 'Asia/Kolkata' } })

      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ timezone: 'Asia/Kolkata' })
      })
    })

    it('should display current timezone from store', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'Europe/London' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      const select = screen.getByLabelText(/timezone/i) as HTMLSelectElement
      expect(select.value).toBe('Europe/London')
    })

    it('should include non-common detected timezone in dropdown', async () => {
      // Mock timezone not in common list
      vi.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
        return {
          resolvedOptions: () => ({
            timeZone: 'Pacific/Fiji'
          })
        } as any
      })

      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: null },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      await waitFor(() => {
        expect(screen.getByText(/Pacific\/Fiji \(detected\)/i)).toBeInTheDocument()
      })

      vi.restoreAllMocks()
    })
  })

  describe('UI Elements', () => {
    it('should render step title', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByText(/your timezone/i)).toBeInTheDocument()
    })

    it('should render explanatory text', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByText(/we detected your timezone/i)).toBeInTheDocument()
      expect(screen.getByText(/helps us schedule focus rooms/i)).toBeInTheDocument()
    })
  })

  describe('Timezone Categories', () => {
    it('should include North American timezones', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByText(/America\/New_York/i)).toBeInTheDocument()
      expect(screen.getByText(/America\/Chicago/i)).toBeInTheDocument()
      expect(screen.getByText(/America\/Denver/i)).toBeInTheDocument()
      expect(screen.getByText(/America\/Los_Angeles/i)).toBeInTheDocument()
    })

    it('should include European timezones', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByText(/Europe\/London/i)).toBeInTheDocument()
      expect(screen.getByText(/Europe\/Paris/i)).toBeInTheDocument()
      expect(screen.getByText(/Europe\/Berlin/i)).toBeInTheDocument()
    })

    it('should include Asian timezones', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByText(/Asia\/Dubai/i)).toBeInTheDocument()
      expect(screen.getByText(/Asia\/Kolkata/i)).toBeInTheDocument()
      expect(screen.getByText(/Asia\/Singapore/i)).toBeInTheDocument()
      expect(screen.getByText(/Asia\/Tokyo/i)).toBeInTheDocument()
    })

    it('should include Australian timezone', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByText(/Australia\/Sydney/i)).toBeInTheDocument()
    })

    it('should include Pacific timezone', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { timezone: 'UTC' },
        updateData: vi.fn()
      })

      render(<StepTimezone />)

      expect(screen.getByText(/Pacific\/Auckland/i)).toBeInTheDocument()
    })
  })
})
