import { create } from 'zustand'

export interface OnboardingData {
  name?: string
  photoFile?: File
  photoId?: string
  photoUrl?: string
  timezone?: string
  interests?: string[]
}

interface OnboardingState {
  currentStep: number
  data: OnboardingData
  setStep: (step: number) => void
  updateData: (data: Partial<OnboardingData>) => void
  reset: () => void
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  data: {},
  setStep: (step) => set({ currentStep: step }),
  updateData: (data) => set((state) => ({
    data: { ...state.data, ...data }
  })),
  reset: () => set({ currentStep: 1, data: {} })
}))
