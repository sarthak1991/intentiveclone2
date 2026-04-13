"use client"

import { useState, useEffect } from 'react'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useTaskSubmission } from '@/hooks/useTaskSubmission'

// Validation schema
const TaskTextSchema = z.string().min(1, 'Task cannot be empty').max(100, 'Task must be 100 characters or less')

export interface TaskSubmissionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: string
  sessionStartTime: Date
  onTaskSubmitted?: (taskId: string) => void
  previousTask?: string
}

/**
 * Modal for submitting a task before the session starts.
 * Shows countdown to session start and enforces 5-minute edit lock.
 */
export function TaskSubmissionModal({
  open,
  onOpenChange,
  roomId,
  sessionStartTime,
  onTaskSubmitted,
  previousTask,
}: TaskSubmissionModalProps) {
  const [task, setTask] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [canEdit, setCanEdit] = useState(true)

  const { submitTask, isSubmitting } = useTaskSubmission(roomId)

  // Calculate time until session starts
  const [minutesUntilStart, setMinutesUntilStart] = useState<number>(
    Math.floor((sessionStartTime.getTime() - Date.now()) / 60000)
  )

  useEffect(() => {
    // Update countdown every minute
    const interval = setInterval(() => {
      const minutes = Math.floor((sessionStartTime.getTime() - Date.now()) / 60000)
      setMinutesUntilStart(minutes)

      // Lock editing after 5 minutes past session start
      if (minutes < -5) {
        setCanEdit(false)
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [sessionStartTime])

  useEffect(() => {
    // Only initialize with previous task if input is empty and modal opens
    // Don't auto-populate - let user choose to use previous goal
  }, [previousTask])

  const handleSubmit = async () => {
    setError(null)

    // Validate with Zod
    const result = TaskTextSchema.safeParse(task.trim())
    if (!result.success) {
      setError(result.error.errors[0]?.message || 'Invalid task')
      return
    }

    const submitResult = await submitTask(result.data)

    if (submitResult.success && submitResult.taskId) {
      onTaskSubmitted?.(submitResult.taskId)
      onOpenChange(false)
    } else {
      setError(submitResult.error || 'Failed to submit task')
    }
  }

  const handleUsePrevious = () => {
    if (previousTask) {
      setTask(previousTask)
      setError(null)
    }
  }

  const charCount = task.length
  const isNearLimit = charCount > 80
  const isAtLimit = charCount >= 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Your Focus Goal</DialogTitle>
          <DialogDescription>
            {minutesUntilStart > 0
              ? `Session starts in ${minutesUntilStart} minute${minutesUntilStart !== 1 ? 's' : ''}`
              : minutesUntilStart > -5
              ? 'Session has started'
              : 'Edit window has closed'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task input */}
          <div className="space-y-2">
            <label htmlFor="task-input" className="text-sm font-medium">
              What will you focus on?
            </label>
            <div className="relative">
              <Input
                id="task-input"
                autoFocus
                value={task}
                onChange={(e) => {
                  setTask(e.target.value)
                  setError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSubmitting && canEdit) {
                    handleSubmit()
                  }
                }}
                disabled={!canEdit || isSubmitting}
                placeholder="e.g., Complete project documentation"
                maxLength={100}
                className={`pr-16 ${isAtLimit ? 'border-destructive' : isNearLimit ? 'border-yellow-500' : ''}`}
              />
              {/* Character counter */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Badge
                  variant={isAtLimit ? 'destructive' : isNearLimit ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {charCount}/100
                </Badge>
              </div>
            </div>

            {/* Validation error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Edit lock notice */}
            {!canEdit && (
              <p className="text-sm text-muted-foreground">
                Task is locked. Editing is only allowed in the first 5 minutes of the session.
              </p>
            )}
          </div>

          {/* Previous goal button */}
          {previousTask && task !== previousTask && canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUsePrevious}
              className="w-full"
            >
              Use previous goal: {previousTask.length > 40 ? previousTask.slice(0, 40) + '...' : previousTask}
            </Button>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !task.trim() || !canEdit}
          >
            {isSubmitting ? 'Submitting...' : 'Set Goal'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
