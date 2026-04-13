'use client'

import Link from 'next/link'

export function StepWelcome() {
  return (
    <div className="step-welcome">
      <h2 className="text-2xl font-bold mb-4">You're all set, {typeof window !== 'undefined' && (window as any).onboardingName || ''}!</h2>
      <p className="text-gray-600 mb-6">
        Welcome to FocusFlow. You're ready to join your first focus room.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">1.</span>
            <span>Browse upcoming focus rooms on the rooms page</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">2.</span>
            <span>Join a room that fits your schedule</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">3.</span>
            <span>Set your goal for the 45-minute session</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">4.</span>
            <span>Focus with accountability and encouragement</span>
          </li>
        </ul>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Want to learn more about how FocusFlow works?
        </p>
        <Link
          href="/how-it-works"
          className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
        >
          <span>How it works</span>
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  )
}
