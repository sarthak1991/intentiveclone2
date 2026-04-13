'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Pencil, X, Users, Shield, Loader2, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  captainId?: string | null
}

interface RoomManagePanelProps {
  rooms: SimpleRoom[]
}

type StatusFilter = 'all' | 'scheduled' | 'open' | 'full' | 'in-progress' | 'completed' | 'cancelled'

export function RoomManagePanel({ rooms }: RoomManagePanelProps) {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedRoom, setSelectedRoom] = useState<SimpleRoom | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isViewingParticipants, setIsViewingParticipants] = useState(false)
  const [isAssigningCaptain, setIsAssigningCaptain] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [editData, setEditData] = useState({
    title: '',
    scheduledTime: '',
    capacity: 12,
    status: 'scheduled' as SimpleRoom['status']
  })
  const [captainId, setCaptainId] = useState<string>('')

  // Filter rooms by status
  const filteredRooms = rooms.filter(room => {
    if (statusFilter === 'all') return true
    return room.status === statusFilter
  })

  // Sort rooms by scheduled time
  const sortedRooms = [...filteredRooms].sort((a, b) =>
    new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  )

  function getStatusColor(status: SimpleRoom['status']): string {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'open':
        return 'bg-green-100 text-green-800'
      case 'full':
        return 'bg-yellow-100 text-yellow-800'
      case 'in-progress':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  function openEditDialog(room: SimpleRoom) {
    setSelectedRoom(room)
    setEditData({
      title: room.title,
      scheduledTime: new Date(room.scheduledTime).toISOString().slice(0, 16),
      capacity: room.capacity,
      status: room.status
    })
    setIsEditing(true)
  }

  function openViewParticipantsDialog(room: SimpleRoom) {
    setSelectedRoom(room)
    setIsViewingParticipants(true)
  }

  function openAssignCaptainDialog(room: SimpleRoom) {
    setSelectedRoom(room)
    setCaptainId(room.captainId || '')
    setIsAssigningCaptain(true)
  }

  function openCancelDialog(room: SimpleRoom) {
    setSelectedRoom(room)
    setIsCancelling(true)
  }

  async function handleUpdateRoom() {
    if (!selectedRoom) return

    setIsLoading(true)

    try {
      // Convert datetime-local format to ISO string
      const scheduledTime = editData.scheduledTime
        ? new Date(editData.scheduledTime).toISOString()
        : undefined

      const response = await fetch(`/api/admin/rooms/${selectedRoom._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: editData.title,
          scheduledTime,
          capacity: editData.capacity,
          status: editData.status
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update room')
      }

      toast.success('Room updated successfully')
      setIsEditing(false)
      setSelectedRoom(null)
      router.refresh()
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update room')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAssignCaptain() {
    if (!selectedRoom) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/captains/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roomId: selectedRoom._id,
          userId: captainId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign captain')
      }

      toast.success('Captain assigned successfully')
      setIsAssigningCaptain(false)
      setSelectedRoom(null)
      router.refresh()
    } catch (error) {
      console.error('Error assigning captain:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to assign captain')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCancelRoom() {
    if (!selectedRoom) return

    setIsLoading(true)

    try {
      const response = await fetch(`/api/rooms/${selectedRoom._id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to cancel room')
      }

      toast.success('Room cancelled successfully')
      setIsCancelling(false)
      setSelectedRoom(null)
      router.refresh()
    } catch (error) {
      console.error('Error cancelling room:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to cancel room')
    } finally {
      setIsLoading(false)
    }
  }

  function getInitials(name: string) {
    const parts = name.trim().split(' ')
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
  }

  if (sortedRooms.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border">
        <p className="text-gray-500 mb-2">No rooms found</p>
        <p className="text-sm text-gray-400">Create a new room to get started</p>
      </div>
    )
  }

  return (
    <>
      {/* Filter controls */}
      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-600">Filter by status:</span>
        {(['all', 'scheduled', 'open', 'full', 'in-progress', 'completed', 'cancelled'] as StatusFilter[]).map(filter => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1 rounded-full text-sm capitalize ${
              statusFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Room table */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Captain</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRooms.map((room) => {
              const captain = room.participants.find(p => p._id === room.captainId)
              return (
                <TableRow key={room._id.toString()}>
                  <TableCell className="font-medium">
                    {format(new Date(room.scheduledTime), 'MMM d, h:mm a')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{room.title}</div>
                      {room.interestTags.length > 0 && (
                        <div className="text-sm text-gray-500 mt-1">
                          {room.interestTags.map(tag => `#${tag}`).join(' ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(room.status)}>
                      {room.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => openViewParticipantsDialog(room)}
                      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      <span>{room.participants.length} / {room.capacity}</span>
                    </button>
                  </TableCell>
                  <TableCell>
                    {captain ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          {captain.photo ? (
                            <AvatarImage src={captain.photo} alt={captain.name} />
                          ) : null}
                          <AvatarFallback className="text-xs bg-yellow-100 text-yellow-800">
                            {getInitials(captain.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-600">{captain.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openAssignCaptainDialog(room)}
                        disabled={room.participants.length === 0}
                        title="Assign Captain"
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(room)}
                        disabled={room.status === 'completed' || room.status === 'cancelled'}
                        title="Edit Room"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCancelDialog(room)}
                        disabled={room.status === 'completed' || room.status === 'cancelled'}
                        title="Cancel Room"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* View Participants Dialog */}
      <Dialog open={isViewingParticipants} onOpenChange={(open) => {
        setIsViewingParticipants(open)
        if (!open) setSelectedRoom(null)
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Room Participants</DialogTitle>
            <DialogDescription>
              {selectedRoom?.title} - {selectedRoom && format(new Date(selectedRoom.scheduledTime), 'MMM d, h:mm a')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedRoom?.participants.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No participants yet</p>
            ) : (
              selectedRoom?.participants.map(participant => (
                <div
                  key={participant._id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <Avatar>
                    {participant.photo ? (
                      <AvatarImage src={participant.photo} alt={participant.name} />
                    ) : null}
                    <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-sm text-gray-500">{participant.email}</div>
                  </div>
                  {selectedRoom.captainId === participant._id && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Crown className="h-3 w-3 mr-1" />
                      Captain
                    </Badge>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => {
              setIsViewingParticipants(false)
              setSelectedRoom(null)
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Captain Dialog */}
      <Dialog open={isAssigningCaptain} onOpenChange={(open) => {
        setIsAssigningCaptain(open)
    if (!open) setSelectedRoom(null)
  }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Room Captain</DialogTitle>
            <DialogDescription>
              Select a participant to be the captain for this room.
            </DialogDescription>
          </DialogHeader>

          {selectedRoom && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="captain">Select Captain</Label>
                <Select value={captainId} onValueChange={setCaptainId} disabled={isLoading}>
                  <SelectTrigger id="captain">
                    <SelectValue placeholder="Select a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedRoom.participants.map(participant => (
                      <SelectItem key={participant._id} value={participant._id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            {participant.photo ? (
                              <AvatarImage src={participant.photo} alt={participant.name} />
                            ) : null}
                            <AvatarFallback className="text-xs">{getInitials(participant.name)}</AvatarFallback>
                          </Avatar>
                          <span>{participant.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAssigningCaptain(false)
                setSelectedRoom(null)
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleAssignCaptain} disabled={!captainId || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign Captain
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => {
        setIsEditing(open)
        if (!open) setSelectedRoom(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Room</DialogTitle>
            <DialogDescription>
              Update room details. Changes will take effect immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-time">Scheduled Time</Label>
              <Input
                id="edit-time"
                type="datetime-local"
                value={editData.scheduledTime}
                onChange={(e) => setEditData({ ...editData, scheduledTime: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-capacity">Capacity</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                max="12"
                value={editData.capacity}
                onChange={(e) => setEditData({ ...editData, capacity: parseInt(e.target.value) })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value as SimpleRoom['status'] })}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="scheduled">Scheduled</option>
                <option value="open">Open</option>
                <option value="full">Full</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setSelectedRoom(null)
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateRoom} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <Dialog open={isCancelling} onOpenChange={(open) => {
        setIsCancelling(open)
        if (!open) setSelectedRoom(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Room?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this room? This action cannot be undone.
              Registered participants will be notified.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCancelling(false)
                setSelectedRoom(null)
              }}
              disabled={isLoading}
            >
              No, Keep Room
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelRoom}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yes, Cancel Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
