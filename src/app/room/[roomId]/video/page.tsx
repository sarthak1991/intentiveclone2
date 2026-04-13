import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { Room } from '@/models/Room'
import { Registration } from '@/models/Registration'
import { connectDB } from '@/lib/db'
import VideoRoomClient from './VideoRoomClient'

interface PageProps {
  params: Promise<{
    roomId: string
  }>
}

export default async function VideoRoomPage({ params }: PageProps) {
  const session = await auth()

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login')
  }

  const { roomId } = await params

  try {
    await connectDB()

    // Fetch room
    const room = await Room.findById(roomId).lean()

    if (!room) {
      redirect('/404')
    }

    // Check if user is registered for this room
    const registration = await Registration.findOne({
      userId: session.user.id,
      roomId: roomId,
      status: { $in: ['registered', 'attended'] }
    }).lean()

    if (!registration) {
      // User not registered, redirect to room details
      redirect(`/room/${roomId}`)
    }

    // Pass data to client component
    return (
      <VideoRoomClient
        roomId={roomId}
        roomTitle={room.title}
        scheduledTime={room.scheduledTime.toISOString()}
        duration={room.duration}
        userId={session.user.id}
        userName={session.user.name || 'User'}
        userPhoto={(session.user.image as string) || null}
      />
    )
  } catch (error) {
    console.error('Error loading video room:', error)
    redirect('/rooms')
  }
}
