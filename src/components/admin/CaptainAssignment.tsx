"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'

export interface Assignment {
  id: string
  captain: {
    id: string
    name: string
    email: string
    photoUrl?: string
  }
  room: {
    id: string
    title: string
    scheduledTime: string
  }
  status: string
  assignedAt: string
}

export interface User {
  id: string
  name: string
  email: string
}

export interface Room {
  id: string
  title: string
  scheduledTime: string
}

/**
 * Admin component for assigning captains to rooms.
 * Supports emergency assignment (bypasses eligibility).
 */
export function CaptainAssignment() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [isEmergency, setIsEmergency] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch rooms on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch rooms
        const roomsRes = await fetch('/api/rooms')
        const roomsData = await roomsRes.json()
        if (roomsData.success) {
          setRooms(roomsData.rooms || [])
        }

        // Fetch users
        const usersRes = await fetch('/api/users')
        const usersData = await usersRes.json()
        if (usersData.success) {
          setUsers(usersData.users || [])
        }

        // Fetch existing assignments
        const assignRes = await fetch('/api/captains/assign')
        const assignData = await assignRes.json()
        if (assignData.success) {
          setAssignments(assignData.assignments || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [])

  const handleAssign = async () => {
    if (!selectedRoom || !selectedUser) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/captains/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedRoom,
          userId: selectedUser,
          isEmergency,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign captain')
      }

      toast.success(
        isEmergency
          ? 'Emergency assignment completed'
          : 'Captain assigned successfully'
      )

      // Refresh assignments
      const assignRes = await fetch('/api/captains/assign')
      const assignData = await assignRes.json()
      if (assignData.success) {
        setAssignments(assignData.assignments || [])
      }

      // Clear selection
      setSelectedRoom('')
      setSelectedUser('')
      setIsEmergency(false)
    } catch (error) {
      console.error('Error assigning captain:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to assign captain')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = async (assignmentId: string) => {
    try {
      const response = await fetch(`/api/admin/captains/assign/${assignmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove assignment')
      }

      toast.success('Captain assignment removed')

      // Refresh assignments
      const assignRes = await fetch('/api/captains/assign')
      const assignData = await assignRes.json()
      if (assignData.success) {
        setAssignments(assignData.assignments || [])
      }
    } catch (error) {
      console.error('Error removing assignment:', error)
      toast.error('Failed to remove assignment')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'invited':
        return <Badge variant="secondary">Invited</Badge>
      case 'accepted':
        return <Badge variant="default" className="bg-green-600">Accepted</Badge>
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>
      case 'removed':
        return <Badge variant="outline">Removed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Captain Assignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assignment Form */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-medium">Assign Captain</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium">Room</label>
            <Select value={selectedRoom} onValueChange={setSelectedRoom}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">User</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="emergency"
              checked={isEmergency}
              onCheckedChange={(checked) => setIsEmergency(checked as boolean)}
            />
            <label
              htmlFor="emergency"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Emergency assignment (skip eligibility)
            </label>
          </div>

          {isEmergency && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ This will bypass the 4+ session requirement
            </p>
          )}

          <Button
            onClick={handleAssign}
            disabled={!selectedRoom || !selectedUser || isLoading}
            className="w-full"
          >
            {isLoading ? 'Assigning...' : 'Assign Captain'}
          </Button>
        </div>

        {/* Current Assignments */}
        <div className="space-y-3">
          <h3 className="font-medium">Current Assignments</h3>
          {assignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {assignment.captain.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {assignment.room?.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(assignment.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemove(assignment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
