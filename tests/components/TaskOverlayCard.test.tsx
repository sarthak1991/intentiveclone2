import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskOverlayCard } from '@/components/room/TaskOverlayCard'
import { useRoomStore } from '@/store/roomStore'

describe('TaskOverlayCard', () => {
  beforeEach(() => {
    // Reset store state before each test
    useRoomStore.getState().reset()
  })

  it('hides when no task submitted', () => {
    const { container } = render(
      <TaskOverlayCard />
    )

    expect(container.firstChild).toBe(null)
  })

  it('displays task when currentTask exists in store', () => {
    const mockTask = {
      taskId: 'task123',
      taskText: 'Complete my project documentation',
      submittedAt: '2026-04-07T09:00:00Z',
      isCompleted: false
    }

    useRoomStore.getState().setCurrentTask(mockTask)

    render(<TaskOverlayCard />)

    // Text appears twice (hidden/shown on hover), use getAllByText
    expect(screen.getAllByText('Complete my project documentation')).toHaveLength(2)
  })

  it('truncates task text to first 5 words', () => {
    const mockTask = {
      taskId: 'task123',
      taskText: 'Complete my project documentation before the end of the week',
      submittedAt: '2026-04-07T09:00:00Z',
      isCompleted: false
    }

    useRoomStore.getState().setCurrentTask(mockTask)

    render(<TaskOverlayCard />)

    // Should show ellipsis for long text
    expect(screen.getByText(/.../)).toBeInTheDocument()
  })

  it('shows full text with 5 or fewer words', () => {
    const mockTask = {
      taskId: 'task123',
      taskText: 'Complete project documentation',
      submittedAt: '2026-04-07T09:00:00Z',
      isCompleted: false
    }

    useRoomStore.getState().setCurrentTask(mockTask)

    render(<TaskOverlayCard />)

    // Text appears twice (hidden/shown on hover)
    expect(screen.getAllByText('Complete project documentation')).toHaveLength(2)
  })

  it('shows completed status with green background when task is completed', () => {
    const mockTask = {
      taskId: 'task123',
      taskText: 'Complete documentation',
      submittedAt: '2026-04-07T09:00:00Z',
      isCompleted: true
    }

    useRoomStore.getState().setCurrentTask(mockTask)
    useRoomStore.getState().setTaskCompleted(true)

    const { container } = render(<TaskOverlayCard />)

    expect(screen.getByText('✓')).toBeInTheDocument()
    expect(screen.getByText('Completed')).toBeInTheDocument()

    // Check for green background class
    const card = container.querySelector('.bg-green-50')
    expect(card).toBeInTheDocument()
  })

  it('shows in-progress status for incomplete tasks', () => {
    const mockTask = {
      taskId: 'task123',
      taskText: 'Complete documentation',
      submittedAt: '2026-04-07T09:00:00Z',
      isCompleted: false
    }

    useRoomStore.getState().setCurrentTask(mockTask)

    render(<TaskOverlayCard />)

    expect(screen.getByText('○')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
  })

  it('shows pulse animation when isPromptActive is true', () => {
    const mockTask = {
      taskId: 'task123',
      taskText: 'Complete documentation',
      submittedAt: '2026-04-07T09:00:00Z',
      isCompleted: false
    }

    useRoomStore.getState().setCurrentTask(mockTask)

    const { container } = render(<TaskOverlayCard isPromptActive={true} />)

    expect(screen.getByText('Click to update')).toBeInTheDocument()

    // Check for pulse/ring classes
    const wrapper = container.querySelector('.animate-pulse')
    expect(wrapper).toBeInTheDocument()
  })

  it('calls onClick when card is clicked', () => {
    const mockTask = {
      taskId: 'task123',
      taskText: 'Complete documentation',
      submittedAt: '2026-04-07T09:00:00Z',
      isCompleted: false
    }

    const handleClick = vi.fn()

    useRoomStore.getState().setCurrentTask(mockTask)

    const { container } = render(<TaskOverlayCard onClick={handleClick} />)

    const clickableDiv = container.querySelector('.group')
    clickableDiv && fireEvent(clickableDiv, new MouseEvent('click', { bubbles: true }))

    expect(handleClick).toHaveBeenCalled()
  })

  it('positions card in top-right corner', () => {
    const mockTask = {
      taskId: 'task123',
      taskText: 'Complete documentation',
      submittedAt: '2026-04-07T09:00:00Z',
      isCompleted: false
    }

    useRoomStore.getState().setCurrentTask(mockTask)

    const { container } = render(<TaskOverlayCard />)

    const cardWrapper = container.querySelector('.fixed.top-4.right-4')
    expect(cardWrapper).toBeInTheDocument()
  })
})
