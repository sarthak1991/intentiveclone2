import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTaskSubmission } from '@/hooks/useTaskSubmission'
import { useRoomStore } from '@/store/roomStore'

// Mock fetch
global.fetch = vi.fn()

describe('useTaskSubmission Hook', () => {
  const mockRoomId = 'room123'

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset store state
    useRoomStore.getState().reset()
  })

  describe('submitTask', () => {
    it('should submit task successfully and update store', async () => {
      const mockResponse = {
        success: true,
        taskId: 'task123',
        taskText: 'Complete my work',
        submittedAt: '2026-04-07T09:00:00Z'
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const submitResult = await result.current.submitTask('Complete my work')

      expect(submitResult).toEqual({ success: true, taskId: 'task123' })
      expect(result.current.isSubmitting).toBe(false)
      expect(result.current.error).toBe(null)

      // Check store was updated
      const store = useRoomStore.getState()
      expect(store.currentTask).toEqual({
        taskId: 'task123',
        taskText: 'Complete my work',
        submittedAt: '2026-04-07T09:00:00Z',
        isCompleted: false
      })
    })

    it('should handle API errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ success: false, error: 'Room not found' })
      } as Response)

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const submitResult = await result.current.submitTask('My task')

      expect(submitResult).toEqual({ success: false, error: 'Room not found' })
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should handle network errors', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'))

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const submitResult = await result.current.submitTask('My task')

      expect(submitResult.success).toBe(false)
      expect(submitResult.error).toBe('Network error')
    })
  })

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const mockResponse = {
        success: true,
        taskId: 'task123',
        taskText: 'Updated task text',
        submittedAt: '2026-04-07T09:00:00Z',
        isCompleted: false
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const updateResult = await result.current.updateTask('task123', 'Updated task text')

      expect(updateResult).toEqual({ success: true })
      expect(result.current.error).toBe(null)
    })

    it('should handle 403 edit lock error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          error: 'Edit window expired',
          message: 'Task can only be edited within 5 minutes'
        })
      } as Response)

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const updateResult = await result.current.updateTask('task123', 'New text')

      expect(updateResult).toEqual({
        success: false,
        error: 'Edit window expired'
      })
    })

    it('should handle task not found error', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: 'Task not found' })
      } as Response)

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const updateResult = await result.current.updateTask('nonexistent', 'New text')

      expect(updateResult.success).toBe(false)
    })
  })

  describe('loadTask', () => {
    it('should load existing task and update store', async () => {
      const mockResponse = {
        success: true,
        taskId: 'task123',
        taskText: 'My existing task',
        submittedAt: '2026-04-07T09:00:00Z',
        isCompleted: true,
        completedAt: '2026-04-07T09:30:00Z'
      }

      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const loadedTask = await result.current.loadTask()

      expect(loadedTask).toEqual({
        taskId: 'task123',
        taskText: 'My existing task',
        submittedAt: '2026-04-07T09:00:00Z',
        isCompleted: true,
        completedAt: '2026-04-07T09:30:00Z'
      })

      // Check store was updated
      const store = useRoomStore.getState()
      expect(store.currentTask).toEqual(loadedTask)
    })

    it('should return null when no task exists (404)', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ success: false, error: 'Task not found' })
      } as Response)

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const loadedTask = await result.current.loadTask()

      expect(loadedTask).toBe(null)
      expect(result.current.error).toBe(null)
    })

    it('should handle load errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Server error' })
      } as Response)

      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      const loadedTask = await result.current.loadTask()

      expect(loadedTask).toBe(null)
    })
  })

  describe('currentTask', () => {
    it('should reflect current task from store', () => {
      const { result } = renderHook(() => useTaskSubmission(mockRoomId))

      expect(result.current.currentTask).toBe(null)

      // Set a task in the store
      const mockTask = {
        taskId: 'task123',
        taskText: 'Test task',
        submittedAt: '2026-04-07T09:00:00Z',
        isCompleted: false
      }

      act(() => {
        useRoomStore.getState().setCurrentTask(mockTask)
      })

      expect(result.current.currentTask).toEqual(mockTask)
    })
  })
})
