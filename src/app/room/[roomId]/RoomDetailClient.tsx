'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Participant {
  _id: string
  name: string
  photo: string | null
}

interface WaitlistEntry {
  user: Participant
  joinedAt: string
}

interface RoomData {
  _id: string
  title: string
  scheduledTime: string
  duration: number
  capacity: number
  status: string
  participants: Participant[]
  waitlist: WaitlistEntry[]
  interestTags: string[]
  createdAt: string
  updatedAt: string
}

interface RoomDetailClientProps {
  room: RoomData
  displayTime: string
  userTimezone: string
  isRegistered: boolean
  isOnWaitlist: boolean
  userId: string
}

export default function RoomDetailClient({
  room,
  displayTime,
  userTimezone,
  isRegistered,
  isOnWaitlist,
  userId
}: RoomDetailClientProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState<string>('')
  const [isJoining, setIsJoining] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  // Countdown timer
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime()
      const sessionTime = new Date(room.scheduledTime).getTime()
      const diff = sessionTime - now

      if (diff <= 0) {
        return 'Session started'
      }

      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60

      if (hours > 0) {
        return `Starts in ${hours}h ${mins}m`
      } else {
        return `Starts in ${mins} minutes`
      }
    }

    setCountdown(calculateCountdown())

    const interval = setInterval(() => {
      setCountdown(calculateCountdown())
    }, 1000)

    return () => clearInterval(interval)
  }, [room.scheduledTime])

  // TEMPORARY: Allow registration and joining at any time, regardless of status
  const canJoin = isRegistered
  const canRegister = !isRegistered
  const roomFull = false // No capacity limit temporarily

  const handleJoinRoom = async () => {
    setIsJoining(true)

    try {
      // If not registered, register first
      if (!isRegistered) {
        const response = await fetch(`/api/rooms/${room._id}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          const data = await response.json()
          alert(data.error || 'Failed to register')
          setIsJoining(false)
          return
        }
      }

      // Navigate to the video room
      router.push(`/room/${room._id}/video`)
    } catch (error) {
      console.error('Join room error:', error)
      alert('Failed to join room. Please try again.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleRegister = async () => {
    setIsRegistering(true)

    try {
      const response = await fetch(`/api/rooms/${room._id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to register')
        return
      }

      // Success - refresh the page to show updated registration status
      router.refresh()
    } catch (error) {
      console.error('Registration error:', error)
      alert('Failed to register. Please try again.')
    } finally {
      setIsRegistering(false)
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'full':
        return 'bg-red-100 text-red-800'
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/rooms"
            className="text-blue-600 hover:text-blue-700 inline-flex items-center"
          >
            ← Back to Rooms
          </Link>
        </div>

        {/* Room details card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {room.title}
              </h1>
              <p className="text-gray-600">
                {displayTime} ({userTimezone})
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(room.status)}`}>
              {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
            </span>
          </div>

          {/* Countdown */}
          <div className="mb-6">
            <p className="text-lg font-semibold text-blue-600">
              {countdown}
            </p>
          </div>

          {/* Room info */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-lg font-semibold">{room.duration} minutes</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Participants</p>
              <p className="text-lg font-semibold">
                {room.participants.length} / {room.capacity}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Session Type</p>
              <p className="text-lg font-semibold">Focus Room</p>
            </div>
          </div>

          {/* Interest tags */}
          {room.interestTags.length > 0 && (
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Interest Tags</p>
              <div className="flex flex-wrap gap-2">
                {room.interestTags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action button */}
          <div className="border-t pt-6">
            <button
              onClick={handleJoinRoom}
              disabled={isJoining}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? 'Joining...' : isRegistered ? 'Enter Room' : 'Register & Join Room'}
            </button>
          </div>
        </div>

        {/* Participants section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Participants ({room.participants.length})
          </h2>

          {room.participants.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No participants yet. Be the first to register!
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {room.participants.map((participant) => (
                <div
                  key={participant._id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{participant.name}</p>
                    <p className="text-sm text-gray-500">Joining soon...</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Waitlist */}
          {room.waitlist.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Waitlist ({room.waitlist.length})
              </h3>
              <div className="space-y-2">
                {room.waitlist.map((entry, index) => (
                  <div
                    key={entry.user._id}
                    className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-semibold text-yellow-700">
                        #{index + 1}
                      </span>
                      <span className="font-medium text-gray-900">
                        {entry.user.name}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      Joined {new Date(entry.joinedAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Session info */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            What to expect
          </h3>
          <ul className="space-y-2 text-blue-800">
            <li>• 45-minute focused work session</li>
            <li>• Submit your goal at the start</li>
            <li>• Receive encouragement from room captains</li>
            <li>• Celebrate completion with the group</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
