'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RegistrationStatus } from '@/lib/rooms'
import { Loader2, Check, X, UserPlus } from 'lucide-react'

interface RegisterButtonProps {
  roomId: string
  registrationStatus: RegistrationStatus
  onRegister?: () => void
  onCancel?: () => void
}

/**
 * RegisterButton component with state-based UI
 *
 * States:
 * - closed: Disabled button with "Registration opens in X time"
 * - opening-soon: Show "Opening soon" message
 * - open: Enabled "Register" button
 * - registered: Show "Registered ✓" (disabled)
 * - full: Show "Room Full" (disabled, red)
 */
export default function RegisterButton({
  roomId,
  registrationStatus,
  onRegister,
  onCancel
}: RegisterButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegister = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rooms/${roomId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to register')
      }

      // Call parent callback to refresh room list
      if (onRegister) {
        onRegister()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      // Keep error visible for 3 seconds
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/rooms/${roomId}/register`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to cancel registration')
      }

      // Call parent callback to refresh room list
      if (onCancel) {
        onCancel()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <Button disabled className="flex-1">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Processing...
      </Button>
    )
  }

  // Registration closed - show when it opens
  if (registrationStatus.status === 'closed') {
    return (
      <div className="flex-1">
        <Button disabled variant="outline" className="w-full">
          {registrationStatus.message}
        </Button>
      </div>
    )
  }

  // Opening soon
  if (registrationStatus.status === 'opening-soon') {
    return (
      <div className="flex-1">
        <Button disabled variant="secondary" className="w-full">
          {registrationStatus.message}
        </Button>
      </div>
    )
  }

  // Room full
  if (registrationStatus.status === 'full') {
    return (
      <div className="flex-1">
        <Button disabled variant="destructive" className="w-full">
          <X className="mr-2 h-4 w-4" />
          Room Full
        </Button>
      </div>
    )
  }

  // Already registered
  if (registrationStatus.status === 'registered') {
    return (
      <div className="flex-1">
        <Button
          disabled
          variant="outline"
          className="w-full border-green-500 text-green-700 hover:bg-green-500/10"
        >
          <Check className="mr-2 h-4 w-4" />
          Registered ✓
        </Button>
      </div>
    )
  }

  // Registration open - show register button
  if (registrationStatus.status === 'open') {
    return (
      <div className="flex-1 flex flex-col gap-2">
        <Button
          onClick={handleRegister}
          className="w-full"
          disabled={isLoading}
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Register
        </Button>

        {error && (
          <p className="text-xs text-red-600 text-center">{error}</p>
        )}
      </div>
    )
  }

  // Fallback
  return null
}
