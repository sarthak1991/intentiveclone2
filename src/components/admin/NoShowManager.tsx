'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { UserCheck, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { IUser, IRoom } from '@/models/types'

interface NoShowManagerProps {
  roomId: string
  participants: IUser[]
  waitlist?: Array<{ user: IUser; joinedAt: Date }>
  onNoShowRecorded: () => void
}

type NoShowStatus = 'attended' | 'no-show' | 'pending'

export function NoShowManager({
  roomId,
  participants,
  waitlist = [],
  onNoShowRecorded
}: NoShowManagerProps) {
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [promotedUser, setPromotedUser] = useState<IUser | null>(null)

  function openNoShowDialog(user: IUser) {
    setSelectedUser(user)
    setRemarks('')
    setIsConfirming(true)
  }

  async function handleConfirmNoShow() {
    if (!selectedUser) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/rooms/${roomId}/noshow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: selectedUser._id.toString(),
          remarks: remarks.trim() || undefined
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to record no-show')
      }

      // Show success with promotion info if applicable
      if (result.promotedUser) {
        setPromotedUser(result.promotedUser)
        toast.success(
          `No-show recorded. ${result.promotedUser.name} promoted from waitlist`
        )
      } else {
        toast.success('No-show recorded successfully')
      }

      setIsConfirming(false)
      setSelectedUser(null)
      setRemarks('')
      onNoShowRecorded()
    } catch (error) {
      console.error('Error recording no-show:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to record no-show')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-3">Registered Participants</h3>
          {participants.length === 0 ? (
            <p className="text-gray-500 text-sm">No participants registered</p>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant._id.toString()}
                  className="flex items-center justify-between p-4 bg-white border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {participant.photoUrl ? (
                      <img
                        src={participant.photoUrl}
                        alt={participant.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {participant.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{participant.name}</div>
                      <div className="text-sm text-gray-500">{participant.email}</div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openNoShowDialog(participant)}
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Mark No-Show
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {waitlist.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Waitlist ({waitlist.length})</h3>
            <div className="space-y-2">
              {waitlist.map(({ user, joinedAt }) => (
                <div
                  key={user._id.toString()}
                  className="flex items-center justify-between p-3 bg-gray-50 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {user.photoUrl ? (
                      <img
                        src={user.photoUrl}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 text-sm font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-sm">{user.name}</div>
                      <div className="text-xs text-gray-500">
                        Joined {new Date(joinedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">#{waitlist.findIndex(w => w.user._id.toString() === user._id.toString()) + 1}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {promotedUser && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <div className="font-medium text-green-900">
                User Promoted from Waitlist
              </div>
              <div className="text-sm text-green-700 mt-1">
                {promotedUser.name} has been promoted from the waitlist and will receive a notification.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No-show confirmation dialog */}
      <Dialog open={isConfirming} onOpenChange={(open) => {
        setIsConfirming(open)
        if (!open) {
          setSelectedUser(null)
          setRemarks('')
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark No-Show?</DialogTitle>
            <DialogDescription>
              Mark <strong>{selectedUser?.name}</strong> as a no-show for this room.
              This will be recorded in their attendance history.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  {waitlist.length > 0
                    ? `If a waitlist exists, the first user will be promoted to the registered participant list.`
                    : 'This session will remain with an open slot.'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (optional)</Label>
              <Input
                id="remarks"
                placeholder="e.g., Didn't join, didn't respond to messages"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Add notes for future reference. This will be saved with the attendance record.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirming(false)
                setSelectedUser(null)
                setRemarks('')
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmNoShow}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm No-Show
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
