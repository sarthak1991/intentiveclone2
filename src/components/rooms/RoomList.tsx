'use client'

import { IRoom } from '@/models/types'
import RoomCard from './RoomCard'
import { RoomWithStatus } from '@/lib/rooms'

interface RoomListProps {
  rooms: RoomWithStatus[]
  userTimezone: string
  isLoading?: boolean
}

/**
 * RoomList component with responsive grid layout
 *
 * Displays:
 * - Grid layout (1 col mobile, 2 col tablet, 3 col desktop)
 * - Room cards for each room
 * - Empty state if no rooms
 * - Loading state while fetching
 * - Error state with retry option
 */
export default function RoomList({
  rooms,
  userTimezone,
  isLoading = false
}: RoomListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!rooms || rooms.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-lg font-semibold mb-2">No rooms scheduled</h3>
          <p className="text-muted-foreground mb-4">
            There are no focus rooms scheduled for this date.
          </p>
          <p className="text-sm text-muted-foreground">
            Try selecting a different date or contact support if you think this is an error.
          </p>
        </div>
      </div>
    )
  }

  // Display room list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Today&apos;s Focus Rooms</h2>
        <p className="text-sm text-muted-foreground">
          {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'} available
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rooms.map((room) => {
          const isRegistered = room.registrationStatus?.status === 'registered'
          return (
            <RoomCard
              key={room._id.toString()}
              room={room}
              userTimezone={userTimezone}
              isRegistered={isRegistered}
            />
          )
        })}
      </div>
    </div>
  )
}
