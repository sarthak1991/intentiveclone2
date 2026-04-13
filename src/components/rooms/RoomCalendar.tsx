'use client'

import { useState } from 'react'
import { IRoom } from '@/models/types'
import { Calendar } from '@/components/ui/calendar'
import { RoomWithStatus } from '@/lib/rooms'
import { format } from 'date-fns'

interface RoomCalendarProps {
  rooms: RoomWithStatus[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
}

/**
 * RoomCalendar component with date selection
 *
 * Features:
 * - Highlight dates that have rooms
 * - Select date to filter rooms
 * - Display selected date rooms
 * - Visual feedback for available dates
 */
export default function RoomCalendar({
  rooms,
  selectedDate,
  onDateSelect
}: RoomCalendarProps) {
  // Extract dates that have rooms
  const datesWithRooms = rooms.map(room => {
    const date = new Date(room.scheduledTime)
    // Reset time to midnight for comparison
    date.setHours(0, 0, 0, 0)
    return date
  })

  // Check if a date has rooms
  const isDateWithRooms = (date: Date) => {
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)

    return datesWithRooms.some(
      roomDate => roomDate.getTime() === checkDate.getTime()
    )
  }

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date)
    }
  }

  // Custom modifiers for styling
  const modifiers = {
    hasRoom: (date: Date) => isDateWithRooms(date)
  }

  const modifiersStyles = {
    hasRoom: {
      fontWeight: 'bold',
      backgroundColor: 'hsl(var(--primary) / 0.1)',
      color: 'hsl(var(--primary))',
      borderRadius: '6px'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Select Date</h2>
        {selectedDate && (
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, 'MMMM d, yyyy')}
          </p>
        )}
      </div>

      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="rounded-md border"
        />
      </div>

      {selectedDate && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            {isDateWithRooms(selectedDate) ? (
              <>Rooms available on {format(selectedDate, 'MMMM d')}</>
            ) : (
              <>No rooms scheduled for {format(selectedDate, 'MMMM d')}</>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
