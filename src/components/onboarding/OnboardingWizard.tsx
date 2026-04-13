'use client'

import { useSession } from 'next-auth/react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { StepNamePhoto } from './StepNamePhoto'
import { StepTimezone } from './StepTimezone'
import { StepInterests } from './StepInterests'
import { StepWelcome } from './StepWelcome'
import { Button } from '@/components/ui/button'

export function OnboardingWizard() {
  const { update } = useSession()
  const { currentStep, setStep, data } = useOnboardingStore()

  const steps = [
    { component: StepNamePhoto, title: 'Welcome!' },
    { component: StepTimezone, title: 'Your Timezone' },
    { component: StepInterests, title: 'Your Interests' },
    { component: StepWelcome, title: 'All Set!' }
  ]

  const CurrentStep = steps[currentStep - 1].component

  const handleNext = async () => {
    if (currentStep < steps.length) {
      setStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    // Save onboarding data to user profile
    const response = await fetch('/api/user/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      // Refresh the JWT so middleware sees isOnboarded: true before redirecting
      await update()
      window.location.href = '/rooms'
    } else {
      alert('Failed to complete onboarding. Please try again.')
    }
  }

  return (
    <div className="wizard-container max-w-2xl mx-auto p-8">
      <div className="progress-bar mb-8">
        {steps.map((_, index) => (
          <div
            key={index}
            className={`step ${index < currentStep ? 'completed' : ''} ${index === currentStep - 1 ? 'active' : ''}`}
          />
        ))}
      </div>

      <div className="step-content mb-8">
        <CurrentStep />
      </div>

      <div className="navigation flex justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={handleNext}>
            Continue
          </Button>
        ) : (
          <Button onClick={handleComplete}>
            Get Started
          </Button>
        )}
      </div>
    </div>
  )
}
