"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useCaptainControls } from '@/hooks/useCaptainControls'
import { useRoomStore } from '@/store/roomStore'
import { Mic, MicOff, Users, Award, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

export interface CaptainPanelProps {
  roomId: string
}

/**
 * Captain control panel with mute controls and reward progress.
 * Only visible to room captain.
 */
export function CaptainPanel({ roomId }: CaptainPanelProps) {
  const {
    isCaptain,
    taskCount,
    mutedParticipants,
    handleMuteAll,
    handleUnmuteAll,
    handleMuteParticipant,
    handleUnmuteParticipant,
  } = useCaptainControls(roomId)

  const participants = useRoomStore((state) => state.participants)
  const [rewards, setRewards] = useState<{
    sessionsCaptained: number
    untilFreeSession: number
    todaySessionCount: number
  } | null>(null)
  const [remarkText, setRemarkText] = useState('')
  const [isSubmittingRemark, setIsSubmittingRemark] = useState(false)
  const [existingRemarks, setExistingRemarks] = useState<string[]>([])

  useEffect(() => {
    if (isCaptain) {
      fetch('/api/captains/rewards')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setRewits(data)
          }
        })
    }
  }, [isCaptain])

  // Fetch existing remarks
  useEffect(() => {
    if (!roomId) return

    const fetchRemarks = async () => {
      try {
        const response = await fetch(`/api/captains/${roomId}/remarks`)
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.remarks) {
            setExistingRemarks([data.remarks])
          }
        }
      } catch (error) {
        console.error('Error fetching remarks:', error)
      }
    }

    fetchRemarks()
  }, [roomId])

  // Don't render if not captain
  if (!isCaptain) {
    return null
  }

  const progressPercent = rewards
    ? ((4 - rewards.untilFreeSession) / 4) * 100
    : 0

  const handleSubmitRemark = async () => {
    if (!remarkText.trim()) return

    setIsSubmittingRemark(true)

    try {
      const response = await fetch(`/api/captains/${roomId}/remarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks: remarkText }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit remark')
      }

      toast.success('Remark submitted')
      setRemarkText('')
      setExistingRemarks([...existingRemarks, data.remarks])
    } catch (error) {
      console.error('Error submitting remark:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to submit remark')
    } finally {
      setIsSubmittingRemark(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Captain Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Task Count (aggregate only, per D-15) */}
        {taskCount && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Task Participation</p>
            <p className="text-lg font-semibold">
              {taskCount.submitted}/{taskCount.total} participants submitted tasks
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({taskCount.percentage}%)
              </span>
            </p>
          </div>
        )}

        {/* Mute Controls */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Mute Controls</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMuteAll}
              disabled={participants.length === 0}
            >
              <MicOff className="h-4 w-4 mr-1" />
              Mute All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnmuteAll}
              disabled={mutedParticipants.size === 0}
            >
              <Mic className="h-4 w-4 mr-1" />
              Unmute All
            </Button>
          </div>

          {/* Individual participant mute */}
          {participants.length > 0 && (
            <div className="mt-2 space-y-1">
              {participants.map((participant) => {
                const isMuted = mutedParticipants.has(participant.userId)
                return (
                  <div
                    key={participant.userId}
                    className="flex items-center justify-between p-2 bg-muted/30 rounded"
                  >
                    <span className="text-sm">{participant.userName}</span>
                    <Button
                      variant={isMuted ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        isMuted
                          ? handleUnmuteParticipant(participant.userId)
                          : handleMuteParticipant(participant.userId)
                      }
                    >
                      {isMuted ? (
                        <>
                          <Mic className="h-3 w-3 mr-1" />
                          Unmute
                        </>
                      ) : (
                        <>
                          <MicOff className="h-3 w-3 mr-1" />
                          Mute
                        </>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Reward Progress */}
        {rewards && (
          <div className="p-3 bg-accent/10 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium flex items-center gap-1">
                <Award className="h-4 w-4" />
                Reward Progress
              </p>
              <Badge variant="secondary">
                {rewards.sessionsCaptained}/4 sessions
              </Badge>
            </div>

            <Progress value={progressPercent} className="h-2 mb-2" />

            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Free sessions earned: {rewards.sessionsCaptained / 4}</span>
              <span>
                {rewards.untilFreeSession === 0
                  ? "Free session earned!"
                  : `${rewards.untilFreeSession} until free session`}
              </span>
            </div>

            {/* Daily limit indicator */}
            <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {rewards.todaySessionCount}/2 sessions today
                {rewards.todaySessionCount >= 2 && " (limit reached)"}
              </span>
            </div>
          </div>
        )}

        {/* Session Remarks */}
        <div className="space-y-2">
          <p className="text-sm font-medium flex items-center gap-1">
            <MessageSquare className="h-4 w-4" />
            Session Notes
          </p>

          {/* Existing remarks display */}
          {existingRemarks.length > 0 && (
            <div className="space-y-1">
              {existingRemarks.map((remark, index) => (
                <div key={index} className="text-sm bg-muted/30 p-2 rounded">
                  {remark}
                </div>
              ))}
            </div>
          )}

          {/* Remark input */}
          <Textarea
            placeholder="Any notes about this session? (optional, 500 chars max)"
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            maxLength={500}
            disabled={isSubmittingRemark}
            className="min-h-[60px] resize-none"
          />

          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {remarkText.length}/500
            </span>
            <Button
              size="sm"
              onClick={handleSubmitRemark}
              disabled={!remarkText.trim() || isSubmittingRemark}
            >
              {isSubmittingRemark ? 'Saving...' : 'Submit Note'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
