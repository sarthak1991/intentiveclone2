import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { User } from '@/models/User'
import { format, startOfDay, endOfDay } from 'date-fns'
import { RoomManagePanel } from '@/components/admin/RoomManagePanel'
import { CaptainEligibility } from '@/components/admin/CaptainEligibility'
import { CaptainAssignment } from '@/components/admin/CaptainAssignment'
import { CaptainRemarks } from '@/components/admin/CaptainRemarks'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

// Define a simpler room type for client component with participant details
interface Participant {
  _id: string
  name: string
  email: string
  photo: string | null
}

interface SimpleRoom {
  _id: string
  title: string
  scheduledTime: string
  duration: number
  capacity: number
  status: string
  participants: Participant[]  // Array of participant details
  participantIds: string[]  // Raw participant IDs for reference
  interestTags: string[]
  createdAt: string
  updatedAt: string
}

export default async function AdminRoomsPage() {
  // Check admin authorization
  const authCheck = await requireAdmin({} as any)

  if (!authCheck.authorized) {
    // Redirect to login if not authenticated, or show 403 if forbidden
    if (authCheck.error?.includes('Unauthorized')) {
      redirect('/login?redirect=/admin/rooms')
    }
    redirect('/403')
  }

  await connectDB()

  // Fetch ALL rooms (not just today's) - use lean() to get plain objects
  // Only exclude cancelled rooms older than 7 days to keep list manageable
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const rooms = await Room.find({
    $or: [
      { scheduledTime: { $gte: sevenDaysAgo } },
      { status: { $in: ['scheduled', 'open', 'full', 'in-progress'] } }
    ]
  })
  .sort({ scheduledTime: 1 })
  .lean()  // Convert to plain JS objects

  // Get all unique participant IDs
  const participantIds = new Set<string>()
  rooms.forEach(room => {
    (room.participants as any[]).forEach((p: any) => {
      participantIds.add(p.toString())
    })
  })

  // Fetch all participants in one query
  const participants = participantIds.size > 0
    ? await User.find({ _id: { $in: Array.from(participantIds) } })
        .select('_id name email photo')
        .lean()
    : []

  // Create a map for quick participant lookup
  const participantMap = new Map<string, Participant>()
  participants.forEach((p: any) => {
    participantMap.set(p._id.toString(), {
      _id: p._id.toString(),
      name: p.name,
      email: p.email,
      photo: p.photo || null
    })
  })

  // Convert Mongoose objects to simple plain objects with participant details
  const simpleRooms: SimpleRoom[] = rooms.map(room => {
    const participantIds = (room.participants as any[]).map((p: any) => p.toString())
    const participantDetails = participantIds
      .map(id => participantMap.get(id))
      .filter(Boolean) as Participant[]

    return {
      _id: room._id.toString(),
      title: room.title,
      scheduledTime: room.scheduledTime.toISOString(),
      duration: room.duration,
      capacity: room.capacity,
      status: room.status,
      participants: participantDetails,
      participantIds: participantIds,
      captainId: room.captainId ? room.captainId.toString() : null,
      interestTags: room.interestTags || [],
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString()
    }
  })

  // Calculate statistics
  const totalRooms = simpleRooms.length
  const totalParticipants = simpleRooms.reduce((sum, room) => sum + room.participants.length, 0)
  const fullRooms = simpleRooms.filter(room => room.participants.length >= room.capacity).length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Room Management</h1>
        <p className="text-gray-600">
          Manage focus rooms, schedules, and participant assignments
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Total Rooms</div>
          <div className="text-3xl font-bold">{totalRooms}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Total Participants</div>
          <div className="text-3xl font-bold">{totalParticipants}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Full Rooms</div>
          <div className="text-3xl font-bold">{fullRooms}</div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-6">
        <Link href="/admin/rooms/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Room
          </Button>
        </Link>
        <Link href="/rooms">
          <Button variant="outline">
            View Schedule
          </Button>
        </Link>
      </div>

      {/* Two column layout: Room management and Captain eligibility */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <RoomManagePanel rooms={simpleRooms} />
        </div>
        <div>
          <CaptainEligibility />
        </div>
      </div>

      {/* Captain Management Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Captain Management</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CaptainAssignment />
          <CaptainRemarks />
        </div>
      </div>
    </div>
  )
}
