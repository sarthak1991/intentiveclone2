import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { useOnboardingStore } from '@/lib/onboarding-store'

// Mock fetch for the completion API
global.fetch = vi.fn()

describe('OnboardingWizard', () => {
  beforeEach(() => {
    // Reset store before each test
    useOnboardingStore.getState().reset()
    vi.clearAllMocks()
  })

  it('should render first step on mount', () => {
    render(<OnboardingWizard />)

    expect(screen.getByText(/Welcome! Let's get you set up/i)).toBeInTheDocument()
  })

  it('should show progress indicator with 4 steps', () => {
    render(<OnboardingWizard />)

    const steps = document.querySelectorAll('.progress-bar .step')
    expect(steps).toHaveLength(4)
  })

  it('should navigate to next step when Continue is clicked', () => {
    render(<OnboardingWizard />)

    const continueButton = screen.getByText('Continue')
    fireEvent.click(continueButton)

    expect(useOnboardingStore.getState().currentStep).toBe(2)
  })

  it('should navigate to previous step when Back is clicked', () => {
    const { rerender } = render(<OnboardingWizard />)

    // Move to step 2
    useOnboardingStore.getState().setStep(2)
    rerender(<OnboardingWizard />)

    const backButtons = screen.getAllByRole('button', { name: 'Back' })
    fireEvent.click(backButtons[backButtons.length - 1])

    expect(useOnboardingStore.getState().currentStep).toBe(1)
  })

  it('should disable Back button on first step', () => {
    render(<OnboardingWizard />)

    const backButton = screen.getByText('Back')
    expect(backButton).toBeDisabled()
  })

  it('should show Get Started button on final step', () => {
    const { rerender } = render(<OnboardingWizard />)

    // Move to step 4
    useOnboardingStore.getState().setStep(4)
    rerender(<OnboardingWizard />)

    const getStartedButtons = screen.getAllByText('Get Started')
    expect(getStartedButtons.length).toBeGreaterThan(0)
    expect(screen.queryByText('Continue')).not.toBeInTheDocument()
  })

  it('should call onboarding API on completion', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    } as Response)

    // Mock window.location
    const mockLocation = { href: '' }
    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    })

    const { rerender } = render(<OnboardingWizard />)

    // Move to step 4
    useOnboardingStore.getState().setStep(4)
    rerender(<OnboardingWizard />)

    const completeButtons = screen.getAllByRole('button', { name: 'Get Started' })
    fireEvent.click(completeButtons[completeButtons.length - 1])

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/user/onboarding',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    )
  })

  it('should show alert if onboarding completion fails', async () => {
    const mockFetch = vi.mocked(fetch)
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to save' })
    } as Response)

    // Mock alert
    const mockAlert = vi.fn()
    global.alert = mockAlert

    const { rerender } = render(<OnboardingWizard />)

    // Move to step 4
    useOnboardingStore.getState().setStep(4)
    rerender(<OnboardingWizard />)

    const completeButtons = screen.getAllByRole('button', { name: 'Get Started' })
    fireEvent.click(completeButtons[completeButtons.length - 1])

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockAlert).toHaveBeenCalledWith('Failed to complete onboarding. Please try again.')
  })
})
