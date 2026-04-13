'use client'

import { useState } from 'react'
import { useOnboardingStore } from '@/lib/onboarding-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function StepNamePhoto() {
  const { data, updateData } = useOnboardingStore()
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(data.photoUrl || null)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('photo', file)

      const response = await fetch('/api/upload/photo', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      if (result.success) {
        updateData({
          photoFile: file,
          photoId: result.photoId,
          photoUrl: result.photoUrl
        })
      } else {
        alert(result.error)
      }
    } catch (error) {
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="step-name-photo">
      <h2 className="text-2xl font-bold mb-4">Welcome! Let's get you set up</h2>
      <p className="text-gray-600 mb-6">First, what should we call you?</p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Your Name</Label>
          <Input
            id="name"
            type="text"
            value={data.name || ''}
            onChange={(e) => updateData({ name: e.target.value })}
            placeholder="Enter your name"
            required
          />
        </div>

        <div>
          <Label htmlFor="photo">Profile Photo (optional)</Label>
          <Input
            id="photo"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={uploading}
          />
          {preview && (
            <div className="mt-4">
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
          )}
          {uploading && <p className="text-sm text-gray-600">Uploading...</p>}
        </div>
      </div>
    </div>
  )
}
