import { ReactNode } from 'react'

export default function OnboardingLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {children}
      </div>
    </div>
  )
}
