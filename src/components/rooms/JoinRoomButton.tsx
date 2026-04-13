'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface JoinRoomButtonProps {
  roomId: string
  isRegistered: boolean
}

/**
 * JoinRoomButton component for one-click room access
 *
 * - If not registered: show disabled button
 * - If registered: show enabled "Join Room" button
 * - Click → Next.js Link to /room/[roomId]
 */
export default function JoinRoomButton({ roomId, isRegistered }: JoinRoomButtonProps) {
  // Don't show button if not registered
  if (!isRegistered) {
    return null
  }

  return (
    <Link href={`/room/${roomId}`} className="flex-1">
      <Button
        className="w-full"
        variant="default"
        aria-label="Join room"
      >
        Join Room
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  )
}
