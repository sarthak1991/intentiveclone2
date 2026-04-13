"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

export interface EligibleUser {
  _id: string
  userId: string
  name: string
  email: string
  photoUrl?: string
  completedCount: number
}

/**
 * Admin component for viewing and inviting eligible users as captains.
 * Shows users with 4+ completed sessions.
 */
export function CaptainEligibility() {
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchEligibleUsers()
  }, [])

  const fetchEligibleUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/captains/eligible')
      const data = await response.json()

      if (data.success) {
        setEligibleUsers(data.eligible)
      }
    } catch (error) {
      console.error('Error fetching eligible users:', error)
      toast.error('Failed to load eligible users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInvite = async (userId: string, userName: string) => {
    try {
      const response = await fetch('/api/captains/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      // Add to invited set
      setInvitedUsers((prev) => new Set(prev).add(userId))

      toast.success(`Invitation sent to ${userName}`)
    } catch (error) {
      console.error('Error sending invitation:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Captain Eligibility</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Captain Eligibility</CardTitle>
        <p className="text-sm text-muted-foreground">
          Users with 4+ completed sessions
        </p>
      </CardHeader>
      <CardContent>
        {eligibleUsers.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No eligible users found. Users need 4+ completed sessions to qualify.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {eligibleUsers.map((user) => {
              const isInvited = invitedUsers.has(user.userId)

              return (
                <div
                  key={user.userId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar placeholder */}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>

                    <Badge variant="secondary">
                      {user.completedCount} sessions
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleInvite(user.userId, user.name)}
                    disabled={isInvited}
                  >
                    {isInvited ? 'Invited' : 'Invite'}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
