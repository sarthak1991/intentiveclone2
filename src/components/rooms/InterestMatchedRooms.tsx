"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { Calendar, Clock, Users, Sparkles } from 'lucide-react'

export interface MatchedRoom {
  id: string
  title: string
  scheduledTime: string
  capacity: number
  participantCount?: number
  spotsAvailable?: number
  interestTags: string[]
  matchedInterests: string[]
  matchScore: number
}

export interface InterestMatchedRoomsProps {
  onRoomSelect?: (roomId: string) => void
}

/**
 * Displays rooms matched based on user's interests.
 * Shows match percentage badge and shared interest tags.
 * Falls back to standard rooms when no matches found.
 */
export function InterestMatchedRooms({ onRoomSelect }: InterestMatchedRoomsProps) {
  const [rooms, setRooms] = useState<MatchedRoom[]>([])
  const [hasMatches, setHasMatches] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMatchedRooms = async () => {
      try {
        const response = await fetch('/api/rooms/match')
        const data = await response.json()

        if (data.success) {
          setRooms(data.rooms)
          setHasMatches(data.matched)
        }
      } catch (err) {
        setError('Failed to load rooms')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatchedRooms()
  }, [])

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'h:mm a')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    return format(date, 'MMM d')
  }

  const handleRoomClick = (roomId: string) => {
    if (onRoomSelect) {
      onRoomSelect(roomId)
    } else {
      window.location.href = `/rooms/${roomId}`
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rooms for You</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-muted rounded-lg animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {hasMatches ? (
            <>
              <Sparkles className="h-5 w-5 text-accent" />
              Rooms for You
            </>
          ) : (
            'Upcoming Rooms'
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center py-6">
            <p className="text-destructive">{error}</p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No upcoming rooms. Check back later!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.id}
                className={`p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                  hasMatches ? 'ring-1 ring-accent' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{room.title}</h3>
                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(room.scheduledTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(room.scheduledTime)}
                      </span>
                      {room.participantCount !== undefined && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {room.participantCount}/{room.capacity}
                        </span>
                      )}
                    </div>

                    {/* Match indicator */}
                    {hasMatches && room.matchScore > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {room.matchedInterests.length > 0
                          ? `Shared: ${room.matchedInterests.join(', ')}`
                          : `${Math.round(room.matchScore)}% match`}
                      </Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleRoomClick(room.id)}
                  >
                    Join
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
