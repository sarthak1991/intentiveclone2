'use client'

import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Label } from '@/components/ui/label'

// Common timezones for manual selection
const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland'
]

export function StepTimezone() {
  const { data, updateData } = useOnboardingStore()
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null)

  useEffect(() => {
    // Auto-detect timezone from browser
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      setDetectedTimezone(tz)
      if (!data.timezone) {
        updateData({ timezone: tz })
      }
    } catch (error) {
      console.error('Failed to detect timezone:', error)
      // Fallback to UTC if detection fails
      if (!data.timezone) {
        updateData({ timezone: 'UTC' })
      }
    }
  }, [data.timezone, updateData])

  return (
    <div className="step-timezone">
      <h2 className="text-2xl font-bold mb-4">Your Timezone</h2>
      <p className="text-gray-600 mb-6">
        We detected your timezone. You can change it if needed.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            value={data.timezone || ''}
            onChange={(e) => updateData({ timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a timezone</option>
            {detectedTimezone && !COMMON_TIMEZONES.includes(detectedTimezone) && (
              <option value={detectedTimezone}>
                {detectedTimezone} (detected)
              </option>
            )}
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz} {tz === detectedTimezone ? '(detected)' : ''}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-gray-500">
          This helps us schedule focus rooms at times that work for you.
        </p>
      </div>
    </div>
  )
}
