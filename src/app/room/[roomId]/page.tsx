import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { formatDisplayTime } from '@/lib/timezone'
import RoomDetailClient from './RoomDetailClient'

interface PageProps {
  params: Promise<{
    roomId: string
  }>
}

export default async function RoomDetailPage({ params }: PageProps) {
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login')
  }

  const { roomId } = await params

  try {
    await connectDB()

    // Fetch room with populated participants
    const room = await Room.findById(roomId)
      .populate('participants', 'name photo')
      .populate('waitlist.user', 'name photo')
      .lean()

    if (!room) {
      redirect('/404')
    }

    // Check if user is registered for this room
    const registration = await Registration.findOne({
      userId: session.user.id,
      roomId: roomId,
      status: { $in: ['registered', 'attended'] }
    }).lean()

    const isRegistered = !!registration

    // Check if user is on waitlist
    const waitlistEntry = (room.waitlist as any[]).find(
      w => w.user._id.toString() === session.user.id
    )
    const isOnWaitlist = !!waitlistEntry

    // Fetch room details for client component
    const roomData = {
      _id: room._id.toString(),
      title: room.title,
      scheduledTime: room.scheduledTime.toISOString(),
      duration: room.duration,
      capacity: room.capacity,
      status: room.status,
      participants: (room.participants as any[]).map(p => ({
        _id: p._id.toString(),
        name: p.name,
        photo: p.photo || null
      })),
      waitlist: (room.waitlist as any[]).map(w => ({
        user: {
          _id: w.user._id.toString(),
          name: w.user.name,
          photo: w.user.photo || null
        },
        joinedAt: w.joinedAt
      })),
      interestTags: room.interestTags || [],
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString()
    }

    // Calculate user's display time
    const user = await User.findById(session.user.id).select('timezone').lean()
    const userTimezone = user?.timezone || 'Asia/Kolkata'
    const displayTime = formatDisplayTime(room.scheduledTime, userTimezone)

    // Pass data to client component
    return (
      <RoomDetailClient
        room={roomData}
        displayTime={displayTime}
        userTimezone={userTimezone}
        isRegistered={isRegistered}
        isOnWaitlist={isOnWaitlist}
        userId={session.user.id}
      />
    )
  } catch (error) {
    console.error('Error loading room:', error)
    redirect('/rooms')
  }
}
