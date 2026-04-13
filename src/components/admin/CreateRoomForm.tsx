'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Zod schema matching the API validation
const CreateRoomSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').optional(),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(120, 'Duration must be less than 120 minutes').optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1').max(12, 'Capacity cannot exceed 12').optional(),
  interestTags: z.string().optional()
})

type CreateRoomFormData = z.infer<typeof CreateRoomSchema>

interface CreateRoomFormProps {
  onSuccess?: () => void
}

export function CreateRoomForm({ onSuccess }: CreateRoomFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty }
  } = useForm<CreateRoomFormData>({
    resolver: zodResolver(CreateRoomSchema),
    defaultValues: {
      title: 'Focus Room',
      scheduledTime: getNextAvailableHour(),
      duration: 45,
      capacity: 12,
      interestTags: ''
    }
  })

  async function onSubmit(data: CreateRoomFormData) {
    setIsSubmitting(true)

    try {
      // Parse interest tags from comma-separated string
      const tags = data.interestTags
        ? data.interestTags.split(',').map(tag => tag.trim()).filter(Boolean)
        : []

      // Convert datetime-local format to ISO string
      const scheduledTime = new Date(data.scheduledTime).toISOString()

      const response = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          scheduledTime,
          interestTags: tags
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create room')
      }

      toast.success('Room created successfully')

      // Call onSuccess callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/admin/rooms')
        router.refresh()
      }
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create room')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Room Title</Label>
        <Input
          id="title"
          type="text"
          placeholder="Focus Room"
          {...register('title')}
          disabled={isSubmitting}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
        <p className="text-sm text-gray-500">
          Optional. Defaults to "Focus Room" if left empty.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledTime">Scheduled Time *</Label>
        <Input
          id="scheduledTime"
          type="datetime-local"
          {...register('scheduledTime')}
          disabled={isSubmitting}
          required
        />
        {errors.scheduledTime && (
          <p className="text-sm text-red-600">{errors.scheduledTime.message}</p>
        )}
        <p className="text-sm text-gray-500">
          When should this room start?
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            min="15"
            max="120"
            {...register('duration', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.duration && (
            <p className="text-sm text-red-600">{errors.duration.message}</p>
          )}
          <p className="text-sm text-gray-500">
            Default: 45 minutes
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            max="12"
            {...register('capacity', { valueAsNumber: true })}
            disabled={isSubmitting}
          />
          {errors.capacity && (
            <p className="text-sm text-red-600">{errors.capacity.message}</p>
          )}
          <p className="text-sm text-gray-500">
            Default: 12 participants
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interestTags">Interest Tags</Label>
        <Input
          id="interestTags"
          type="text"
          placeholder="coding, writing, learning"
          {...register('interestTags')}
          disabled={isSubmitting}
        />
        {errors.interestTags && (
          <p className="text-sm text-red-600">{errors.interestTags.message}</p>
        )}
        <p className="text-sm text-gray-500">
          Comma-separated tags to group participants by interest (optional)
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="flex-1"
        >
          {isSubmitting ? 'Creating...' : 'Create Room'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/admin/rooms')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Helper function to get next available hour
function getNextAvailableHour(): string {
  const now = new Date()
  const nextHour = new Date(now)
  nextHour.setHours(now.getHours() + 1, 0, 0, 0)

  // Format to datetime-local input format: YYYY-MM-DDTHH:mm
  const year = nextHour.getFullYear()
  const month = String(nextHour.getMonth() + 1).padStart(2, '0')
  const day = String(nextHour.getDate()).padStart(2, '0')
  const hours = String(nextHour.getHours()).padStart(2, '0')
  const minutes = String(nextHour.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}
