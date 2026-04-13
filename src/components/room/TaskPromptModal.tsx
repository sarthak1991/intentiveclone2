"use client"

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRoomStore } from '@/store/roomStore'
import { useTaskPrompt } from '@/hooks/useTaskPrompt'
import { useConfetti } from '@/hooks/useConfetti'
import { useTaskSubmission } from '@/hooks/useTaskSubmission'

export interface TaskPromptModalProps {
  roomId: string
  sessionStartTime: Date
  durationMinutes?: number
}

/**
 * Modal that prompts user 5 minutes before session end:
 * "Did you complete your task?"
 *
 * Triggers confetti celebration on "Yes" response.
 * Marks task as incomplete on "Not yet" response.
 */
export function TaskPromptModal({
  roomId,
  sessionStartTime,
  durationMinutes = 45,
}: TaskPromptModalProps) {
  const currentTask = useRoomStore((state) => state.currentTask)
  const setTaskCompleted = useRoomStore((state) => state.setTaskCompleted)

  const { isPromptActive, minutesRemaining } = useTaskPrompt(sessionStartTime, durationMinutes)
  const { triggerConfetti } = useConfetti()
  const { updateTask } = useTaskSubmission(roomId)

  const [isOpen, setIsOpen] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  // Open modal when prompt becomes active and task exists and not completed
  useEffect(() => {
    if (isPromptActive && currentTask && !currentTask.isCompleted) {
      setIsOpen(true)
    }
  }, [isPromptActive, currentTask])

  const handleComplete = async () => {
    if (!currentTask) return

    setIsCompleting(true)

    try {
      // Call API to mark task complete
      await fetch(`/api/tasks/${currentTask.taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true }),
      })

      // Update local state
      setTaskCompleted(true, new Date().toISOString())

      // Trigger confetti celebration
      triggerConfetti()

      // Close modal after delay to show confetti
      setTimeout(() => {
        setIsOpen(false)
      }, 2000)
    } catch (error) {
      console.error('Error marking task complete:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  const handleIncomplete = async () => {
    if (!currentTask) return

    setIsCompleting(true)

    try {
      // Call API to mark task incomplete
      await fetch(`/api/tasks/${currentTask.taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completed: false,
          incompleteReason: 'User marked incomplete at end of session',
        }),
      })

      // Update local state
      setTaskCompleted(false)

      // Close modal immediately
      setIsOpen(false)
    } catch (error) {
      console.error('Error marking task incomplete:', error)
    } finally {
      setIsCompleting(false)
    }
  }

  // Don't render if no task or already completed
  if (!currentTask || currentTask.isCompleted) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Session Almost Over!</DialogTitle>
          <DialogDescription>
            {minutesRemaining > 0
              ? `${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} remaining`
              : 'Time is up!'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-lg font-medium">Did you complete your task?</p>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Your goal:</p>
            <p className="font-medium">{currentTask.taskText}</p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
          <Button
            variant="outline"
            onClick={handleIncomplete}
            disabled={isCompleting}
          >
            Not yet
          </Button>
          <Button
            onClick={handleComplete}
            disabled={isCompleting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCompleting ? 'Saving...' : 'Yes, I completed it!'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
