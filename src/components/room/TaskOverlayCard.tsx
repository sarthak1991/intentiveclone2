"use client"

import { useRoomStore } from '@/store/roomStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface TaskOverlayCardProps {
  onClick?: () => void
  isPromptActive?: boolean
}

/**
 * Corner overlay card displaying user's task during session.
 * Shows first 3-5 words truncated, expands on hover.
 * Displays in top-right corner with green background when completed.
 */
export function TaskOverlayCard({ onClick, isPromptActive = false }: TaskOverlayCardProps) {
  const currentTask = useRoomStore((state) => state.currentTask)
  const isTaskCompleted = useRoomStore((state) => state.isTaskCompleted)

  // Hide when no task submitted
  if (!currentTask) {
    return null
  }

  // Truncate taskText to first 5 words (~30 chars)
  const truncateTask = (text: string): string => {
    const words = text.trim().split(/\s+/)
    if (words.length <= 5) return text

    const firstFive = words.slice(0, 5).join(' ')
    return `${firstFive}...`
  }

  const truncatedText = truncateTask(currentTask.taskText)
  const isCompleted = isTaskCompleted || currentTask.isCompleted

  return (
    <div
      onClick={onClick}
      className={`
        group fixed top-4 right-4 z-40 max-w-xs p-3 cursor-pointer
        transition-all duration-300 hover:max-w-md
        ${isPromptActive ? 'animate-pulse ring-2 ring-accent' : ''}
      `}
    >
      <Card
        className={`
          ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-background'}
          transition-colors duration-300
        `}
      >
        <CardContent className="p-3">
          {/* Status icon and label */}
          <div className="flex items-center gap-2 mb-2">
            {isCompleted ? (
              <>
                <span className="text-green-600 font-bold">✓</span>
                <Badge variant="outline" className="text-green-700 border-green-300">
                  Completed
                </Badge>
              </>
            ) : (
              <>
                <span className="text-muted-foreground">○</span>
                <Badge variant="secondary" className="text-xs">
                  In Progress
                </Badge>
              </>
            )}
          </div>

          {/* Task text - truncated by default, full on hover */}
          <div className="relative">
            {/* Default: show truncated text */}
            <p className={`text-sm ${isCompleted ? 'text-green-800' : 'text-foreground'} group-hover:hidden`}>
              {truncatedText}
            </p>

            {/* Hover: show full text */}
            <p className={`text-sm hidden ${isCompleted ? 'text-green-800' : 'text-foreground'} group-hover:block break-words`}>
              {currentTask.taskText}
            </p>
          </div>

          {/* Pulse indicator when prompt is active */}
          {isPromptActive && (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span className="text-xs text-muted-foreground">Click to update</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
