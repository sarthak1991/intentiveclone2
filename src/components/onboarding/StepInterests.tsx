'use client'

import { useOnboardingStore } from '@/lib/onboarding-store'
import { Label } from '@/components/ui/label'

// Pre-defined interest tags
const INTEREST_TAGS = {
  Occupation: [
    'Student',
    'Developer',
    'Designer',
    'Writer',
    'Entrepreneur',
    'Researcher',
    'Freelancer',
    'Remote Worker'
  ],
  Goals: [
    'Deep Work',
    'Study Sessions',
    'Creative Projects',
    'Business Building',
    'Learning',
    'Writing',
    'Research',
    'Job Search'
  ],
  'Expertise Level': [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Expert'
  ]
}

export function StepInterests() {
  const { data, updateData } = useOnboardingStore()
  const selectedInterests = data.interests || []

  const toggleInterest = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest]

    updateData({ interests: newInterests })
  }

  return (
    <div className="step-interests">
      <h2 className="text-2xl font-bold mb-4">Your Interests</h2>
      <p className="text-gray-600 mb-6">
        Select tags that describe you. This helps us match you with like-minded people.
      </p>

      <div className="space-y-6">
        {Object.entries(INTEREST_TAGS).map(([category, tags]) => (
          <div key={category}>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              {category}
            </Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`px-4 py-2 rounded-full border transition-colors ${
                    selectedInterests.includes(tag)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedInterests.length > 0 && (
        <p className="mt-6 text-sm text-gray-600">
          You selected {selectedInterests.length} tag{selectedInterests.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
