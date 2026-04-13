"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { Calendar, Clock, Users } from 'lucide-react'

export interface NextRoomSuggestionProps {
  currentRoomId: string
  onTaskIncomplete?: (taskText: string) => void
  previousTask?: string
  sessionCompleted?: boolean
}

export interface NextRoom {
  id: string
  title: string
  scheduledTime: string
  capacity: number
  participantCount: number
  spotsAvailable: number
}

/**
 * Component that shows next available rooms after session completion.
 * Displays previous incomplete task as suggestion (not auto-fill).
 */
export function NextRoomSuggestion({
  currentRoomId,
  onTaskIncomplete,
  previousTask,
  sessionCompleted = true,
}: NextRoomSuggestionProps) {
  const [nextRooms, setNextRooms] = useState<NextRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTask, setSelectedTask] = useState<string>('')

  useEffect(() => {
    const fetchNextRooms = async () => {
      try {
        const response = await fetch('/api/rooms/next')
        const data = await response.json()

        if (data.success) {
          // Filter out current room
          const filtered = data.rooms.filter(
            (room: NextRoom) => room.id !== currentRoomId
          )
          setNextRooms(filtered)
        }
      } catch (error) {
        console.error('Error fetching next rooms:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNextRooms()
  }, [currentRoomId])

  const handleReuseTask = () => {
    if (previousTask) {
      setSelectedTask(previousTask)
      onTaskIncomplete?.(previousTask)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'h:mm a')
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

  return (
    <div className="space-y-6">
      {/* Session complete message */}
      {sessionCompleted && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <p className="text-center text-lg font-medium text-green-800">
              Session complete! 🎉
            </p>
          </CardContent>
        </Card>
      )}

      {/* Previous task suggestion */}
      {previousTask && !selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Continue your goal?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your previous goal wasn't completed. Would you like to continue with it?
            </p>
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="font-medium">{previousTask}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleReuseTask}
              className="w-full"
            >
              Reuse this goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Selected task confirmation */}
      {selectedTask && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <p className="text-sm text-blue-800">
              ✓ Goal copied: {selectedTask}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              It will be pre-filled in the next room's task input.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next available rooms */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Next Available Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading rooms...</p>
          ) : nextRooms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No rooms available right now.</p>
              <p className="text-sm text-muted-foreground mt-1">
                Check back later!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {nextRooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium">{room.title}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(room.scheduledTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(room.scheduledTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {room.participantCount}/{room.capacity}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={room.spotsAvailable <= 2 ? 'destructive' : 'secondary'}
                  >
                    {room.spotsAvailable} spots left
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Go to dashboard button */}
      <Link href="/rooms">
        <Button variant="outline" className="w-full">
          Browse all rooms
        </Button>
      </Link>
    </div>
  )
}
