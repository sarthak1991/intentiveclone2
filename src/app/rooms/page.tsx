'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { RoomWithStatus } from '@/lib/rooms'
import RoomList from '@/components/rooms/RoomList'
import RoomCalendar from '@/components/rooms/RoomCalendar'
import { InterestMatchedRooms } from '@/components/rooms/InterestMatchedRooms'
import { Button } from '@/components/ui/button'
import { List, Calendar as CalendarIcon, Loader2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { getUserTimezone } from '@/lib/timezone'

type ViewState = 'list' | 'calendar'

/**
 * Rooms page with view toggle (list/calendar)
 *
 * Features:
 * - View toggle between list and calendar views
 * - List view: Show today's rooms
 * - Calendar view: Select date to see rooms
 * - Timezone-aware room times
 * - Authentication required
 * - Loading and error states
 */
export default function RoomsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [viewState, setViewState] = useState<ViewState>('list')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [displayRooms, setDisplayRooms] = useState<RoomWithStatus[]>([])
  const [allRooms, setAllRooms] = useState<RoomWithStatus[]>([]) // For calendar highlighting
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userTimezone, setUserTimezone] = useState<string>('UTC')
  const [isAdmin, setIsAdmin] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Fetch rooms when authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      // Set user timezone from session or default to browser timezone
      const timezone = (session?.user as any)?.timezone ||
                      Intl.DateTimeFormat().resolvedOptions().timeZone
      setUserTimezone(timezone)

      // Check if user is admin
      fetch('/api/auth/check-admin')
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin || false))
        .catch(() => setIsAdmin(false))

      // Initial fetch based on view
      if (viewState === 'calendar') {
        fetchAllRoomsForCalendar()
        fetchRoomsForDate(selectedDate)
      } else {
        fetchTodaysRooms()
      }
    }
  }, [status, session])

  // When switching views, refetch appropriate rooms
  useEffect(() => {
    if (status === 'authenticated') {
      if (viewState === 'calendar') {
        fetchAllRoomsForCalendar()
        fetchRoomsForDate(selectedDate)
      } else {
        fetchTodaysRooms()
      }
    }
  }, [viewState, status])

  // Fetch rooms for selected date when it changes
  useEffect(() => {
    if (status === 'authenticated' && viewState === 'calendar') {
      fetchRoomsForDate(selectedDate)
    }
  }, [selectedDate, status])

  const fetchTodaysRooms = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/rooms')
      if (!response.ok) {
        throw new Error('Failed to fetch rooms')
      }

      const data = await response.json()
      setDisplayRooms(data.rooms || [])
      setAllRooms(data.rooms || []) // Also store as all rooms for list view
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllRoomsForCalendar = async () => {
    try {
      // Fetch rooms for a wide date range (past 7 days to future 30 days)
      // This ensures calendar highlights all available dates
      const today = new Date()
      const pastWeek = new Date(today)
      pastWeek.setDate(pastWeek.getDate() - 7)
      const futureMonth = new Date(today)
      futureMonth.setDate(futureMonth.getDate() + 30)

      const startDate = pastWeek.toISOString().split('T')[0]
      const endDate = futureMonth.toISOString().split('T')[0]

      const response = await fetch(`/api/rooms?startDate=${startDate}&endDate=${endDate}`)
      if (!response.ok) {
        console.error('Failed to fetch calendar rooms')
        return
      }

      const data = await response.json()
      setAllRooms(data.rooms || [])
    } catch (err) {
      console.error('Error fetching calendar rooms:', err)
    }
  }

  const fetchRoomsForDate = async (date: Date) => {
    setIsLoading(true)
    setError(null)

    try {
      // Format date as local date string (not ISO to avoid UTC conversion issues)
      const dateStr = format(date, 'yyyy-MM-dd')
      const response = await fetch(`/api/rooms?date=${dateStr}`)
      if (!response.ok) {
        throw new Error('Failed to fetch rooms')
      }

      const data = await response.json()
      setDisplayRooms(data.rooms || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">Focus Rooms</h1>
          <p className="text-muted-foreground">
            Join 45-minute focus sessions with community accountability
          </p>
        </div>
        {isAdmin && (
          <Link href="/admin/rooms/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </Link>
        )}
      </div>

      {/* Interest-Matched Rooms Section */}
      {status === 'authenticated' && session?.user && (
        <div className="mb-8">
          <InterestMatchedRooms onRoomSelect={(roomId) => router.push(`/rooms/${roomId}`)} />
        </div>
      )}

      {/* View Toggle */}
      <div className="mb-6 flex items-center gap-2">
        <Button
          variant={viewState === 'list' ? 'default' : 'outline'}
          onClick={() => {
            setViewState('list')
            // Switch to list view - show today's rooms
            fetchTodaysRooms()
          }}
          className="flex-1 sm:flex-none"
        >
          <List className="mr-2 h-4 w-4" />
          List View
        </Button>
        <Button
          variant={viewState === 'calendar' ? 'default' : 'outline'}
          onClick={() => {
            setViewState('calendar')
            // Switch to calendar view - fetch calendar data
            fetchAllRoomsForCalendar()
            fetchRoomsForDate(selectedDate)
          }}
          className="flex-1 sm:flex-none"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          Calendar View
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
          <Button
            onClick={() => {
              if (viewState === 'calendar') {
                fetchAllRoomsForCalendar()
                fetchRoomsForDate(selectedDate)
              } else {
                fetchTodaysRooms()
              }
              setError(null)
            }}
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Content Area */}
      {viewState === 'list' ? (
        <RoomList
          rooms={displayRooms}
          userTimezone={userTimezone}
          isLoading={isLoading}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <RoomCalendar
              rooms={allRooms}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>
          <div className="lg:col-span-2">
            <RoomList
              rooms={displayRooms}
              userTimezone={userTimezone}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
    </div>
  )
}
