"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, formatRelative } from 'date-fns'
import { Calendar, Clock } from 'lucide-react'

export interface Session {
  id: string
  roomTitle: string
  scheduledTime: Date
  status: 'attended' | 'no-show'
  taskCompleted: boolean
}

export interface SessionHistoryProps {
  userId: string
}

/**
 * Displays past 7 sessions with status icons.
 * Status: ✓ (green) for completed, ○ (gray) for incomplete, ✗ (red) for no-show
 */
export function SessionHistory({ userId }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/user/history')
        const data = await response.json()

        if (data.success) {
          setSessions(data.sessions)
        }
      } catch (error) {
        console.error('Error fetching session history:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [userId])

  const getStatusIcon = (session: Session) => {
    if (session.status === 'no-show') {
      return <span className="text-red-500 font-bold">✗</span>
    }

    if (session.taskCompleted) {
      return <span className="text-green-600 font-bold">✓</span>
    }

    return <span className="text-muted-foreground">○</span>
  }

  const getStatusBadge = (session: Session) => {
    if (session.status === 'no-show') {
      return <Badge variant="destructive">No-show</Badge>
    }

    if (session.taskCompleted) {
      return <Badge variant="default" className="bg-green-600">Completed</Badge>
    }

    return <Badge variant="outline">Incomplete</Badge>
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Past 7 Sessions</CardTitle>
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
        <CardTitle>Past 7 Sessions</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No sessions attended yet. Join your first focus room!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {/* Status icon */}
                  <div className="w-8 h-8 flex items-center justify-center">
                    {getStatusIcon(session)}
                  </div>

                  {/* Session details */}
                  <div>
                    <p className="font-medium">{session.roomTitle}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(session.scheduledTime), 'MMM d')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(session.scheduledTime), 'h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                {getStatusBadge(session)}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
