"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, formatRelative } from 'date-fns'
import { MessageSquare } from 'lucide-react'

export interface CaptainRemark {
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
  remarks: string
  assignedAt: string
}

/**
 * Admin component for viewing captain remarks about sessions.
 */
export function CaptainRemarks() {
  const [remarks, setRemarks] = useState<CaptainRemark[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchRemarks = async () => {
      try {
        const response = await fetch('/api/admin/captains/remarks')
        const data = await response.json()

        if (data.success) {
          setRemarks(data.remarks || [])
        }
      } catch (error) {
        console.error('Error fetching remarks:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRemarks()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Captain Remarks</CardTitle>
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
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Captain Remarks
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Feedback from room captains
        </p>
      </CardHeader>
      <CardContent>
        {remarks.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              No captain remarks yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {remarks.map((remark) => {
              const fullRemark = remark.remarks
              const isLong = fullRemark.length > 200
              const displayRemark = isLong
                ? fullRemark.slice(0, 200) + '...'
                : fullRemark
              const [expanded, setExpanded] = useState(false)

              return (
                <div
                  key={remark.id}
                  className="p-4 border rounded-lg space-y-2"
                >
                  <div className="flex items-center gap-2">
                    {/* Captain info */}
                    <span className="font-medium">
                      {remark.captain.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      for {remark.room?.title}
                    </span>
                  </div>

                  {/* Remark text */}
                  <p className="text-sm bg-muted/50 p-2 rounded">
                    {expanded ? fullRemark : displayRemark}
                    {isLong && (
                      <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-xs text-blue-600 ml-1 hover:underline"
                      >
                        {expanded ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </p>

                  {/* Date */}
                  <p className="text-xs text-muted-foreground">
                    {formatRelative(new Date(remark.assignedAt), new Date())}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
