import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboardingStore } from '@/lib/onboarding-store'

describe('Onboarding Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useOnboardingStore.getState().reset()
  })

  it('should initialize with step 1 and empty data', () => {
    const state = useOnboardingStore.getState()
    expect(state.currentStep).toBe(1)
    expect(state.data).toEqual({})
  })

  it('should update current step', () => {
    const { setStep } = useOnboardingStore.getState()

    setStep(2)
    expect(useOnboardingStore.getState().currentStep).toBe(2)

    setStep(3)
    expect(useOnboardingStore.getState().currentStep).toBe(3)
  })

  it('should update onboarding data', () => {
    const { updateData } = useOnboardingStore.getState()

    updateData({ name: 'John Doe' })
    expect(useOnboardingStore.getState().data.name).toBe('John Doe')

    updateData({ timezone: 'Asia/Kolkata' })
    expect(useOnboardingStore.getState().data.timezone).toBe('Asia/Kolkata')
    expect(useOnboardingStore.getState().data.name).toBe('John Doe') // Previous data preserved
  })

  it('should reset store to initial state', () => {
    const { setStep, updateData, reset } = useOnboardingStore.getState()

    setStep(3)
    updateData({
      name: 'John Doe',
      timezone: 'Asia/Kolkata',
      interests: ['coding', 'design']
    })

    reset()

    expect(useOnboardingStore.getState().currentStep).toBe(1)
    expect(useOnboardingStore.getState().data).toEqual({})
  })

  it('should handle multiple data updates', () => {
    const { updateData } = useOnboardingStore.getState()

    updateData({
      name: 'Jane Doe',
      timezone: 'America/New_York',
      interests: ['writing', 'reading']
    })

    const state = useOnboardingStore.getState()
    expect(state.data.name).toBe('Jane Doe')
    expect(state.data.timezone).toBe('America/New_York')
    expect(state.data.interests).toEqual(['writing', 'reading'])
  })
})
