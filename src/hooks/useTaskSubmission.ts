import { useState, useCallback } from 'react'
import { useRoomStore, type Task } from '@/store/roomStore'

interface UseTaskSubmissionReturn {
  submitTask: (taskText: string) => Promise<{ success: boolean; taskId?: string; error?: string }>
  updateTask: (taskId: string, taskText: string) => Promise<{ success: boolean; error?: string }>
  loadTask: () => Promise<Task | null>
  isSubmitting: boolean
  error: string | null
  currentTask: Task | null
}

/**
 * Hook for managing task submission and lifecycle
 * Handles task creation, updates, and loading with proper error handling
 */
export function useTaskSubmission(roomId: string): UseTaskSubmissionReturn {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentTask = useRoomStore((state) => state.currentTask)
  const setCurrentTask = useRoomStore((state) => state.setCurrentTask)

  /**
   * Submit a new task for the current room
   */
  const submitTask = useCallback(async (taskText: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Failed to submit task')
        return { success: false, error: data.error }
      }

      // Update store with new task
      const task: Task = {
        taskId: data.taskId,
        taskText: data.taskText,
        submittedAt: data.submittedAt,
        isCompleted: false
      }
      setCurrentTask(task)

      return { success: true, taskId: data.taskId }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSubmitting(false)
    }
  }, [roomId, setCurrentTask])

  /**
   * Update an existing task (subject to 5-minute edit lock)
   */
  const updateTask = useCallback(async (taskId: string, taskText: string) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskText })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        // Handle edit lock error specifically
        if (response.status === 403) {
          setError(data.message || data.error || 'Edit window expired')
        } else {
          setError(data.error || 'Failed to update task')
        }
        return { success: false, error: data.error || data.message }
      }

      // Update store with updated task
      const task: Task = {
        taskId: data.taskId,
        taskText: data.taskText,
        submittedAt: data.submittedAt,
        isCompleted: data.isCompleted,
        completedAt: data.completedAt
      }
      setCurrentTask(task)

      return { success: true }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setIsSubmitting(false)
    }
  }, [setCurrentTask])

  /**
   * Load existing task for the current room
   */
  const loadTask = useCallback(async (): Promise<Task | null> => {
    setError(null)

    try {
      const response = await fetch(`/api/tasks/${roomId}`)

      if (!response.ok) {
        if (response.status === 404) {
          // No task exists yet, return null
          return null
        }
        setError('Failed to load task')
        return null
      }

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Failed to load task')
        return null
      }

      // Update store with loaded task
      const task: Task = {
        taskId: data.taskId,
        taskText: data.taskText,
        submittedAt: data.submittedAt,
        isCompleted: data.isCompleted,
        completedAt: data.completedAt
      }
      setCurrentTask(task)

      return task
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error'
      setError(errorMessage)
      return null
    }
  }, [roomId, setCurrentTask])

  return {
    submitTask,
    updateTask,
    loadTask,
    isSubmitting,
    error,
    currentTask
  }
}
