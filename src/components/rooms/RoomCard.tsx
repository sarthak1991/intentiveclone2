'use client'

import Link from 'next/link'
import { IRoom } from '@/models/types'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Users } from 'lucide-react'
import { RoomWithStatus } from '@/lib/rooms'
import RegisterButton from './RegisterButton'
import JoinRoomButton from './JoinRoomButton'

interface RoomCardProps {
  room: RoomWithStatus
  userTimezone: string
  isRegistered?: boolean
}

/**
 * RoomCard component displays room details with action buttons
 *
 * Shows:
 * - Room title and scheduled time
 * - Participant count and capacity
 * - Room status badge
 * - Registration button (state-based)
 * - Join room button (if registered)
 */
export default function RoomCard({ room, userTimezone, isRegistered = false }: RoomCardProps) {
  // Handle missing data gracefully
  if (!room) {
    return null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500/10 text-green-700 hover:bg-green-500/20'
      case 'scheduled':
        return 'bg-yellow-500/10 text-yellow-700 hover:bg-yellow-500/20'
      case 'full':
        return 'bg-red-500/10 text-red-700 hover:bg-red-500/20'
      case 'in-progress':
        return 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20'
      case 'completed':
        return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
      case 'cancelled':
        return 'bg-red-500/10 text-red-700 hover:bg-red-500/20'
      default:
        return 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20'
    }
  }

  const participantCount = room.participants?.length || 0
  const capacity = room.capacity || 12
  const displayTime = room.displayTime || 'Time not available'
  const status = room.status || 'scheduled'
  const registrationStatus = room.registrationStatus

  return (
    <Card className="w-full hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold leading-tight">{room.title || 'Focus Room'}</h3>
            <p className="text-sm text-muted-foreground mt-1">Focus Room</p>
          </div>
          <Badge className={getStatusColor(status)} variant="secondary">
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-3">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{displayTime}</span>
          <span className="text-muted-foreground">({userTimezone})</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            {participantCount} / {capacity} participants
          </span>
        </div>

        {room.interestTags && room.interestTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {room.interestTags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {room.interestTags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{room.interestTags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3" onClick={e => e.preventDefault()}>
        {registrationStatus && (
          <RegisterButton
            roomId={room._id.toString()}
            registrationStatus={registrationStatus}
          />
        )}

        {isRegistered && (
          <JoinRoomButton
            roomId={room._id.toString()}
            isRegistered={isRegistered}
          />
        )}
      </CardFooter>
    </Card>
  )
}
