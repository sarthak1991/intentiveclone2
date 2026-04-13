import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskSubmissionModal } from '@/components/lobby/TaskSubmissionModal'

// Mock the useTaskSubmission hook
const mockSubmitTask = vi.fn()
vi.mock('@/hooks/useTaskSubmission', () => ({
  useTaskSubmission: vi.fn(() => ({
    submitTask: mockSubmitTask,
    isSubmitting: false,
    error: null,
    currentTask: null
  }))
}))

describe('TaskSubmissionModal', () => {
  const mockRoomId = 'room123'
  const mockSessionStartTime = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  const mockOnTaskSubmitted = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSubmitTask.mockResolvedValue({ success: true, taskId: 'task123' })
  })

  it('renders when open', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
      />
    )

    expect(screen.getByText('Set Your Focus Goal')).toBeInTheDocument()
  })

  it('does not render content when closed', () => {
    render(
      <TaskSubmissionModal
        open={false}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
      />
    )

    expect(screen.queryByText('Set Your Focus Goal')).not.toBeInTheDocument()
  })

  it('shows countdown to session start', () => {
    const startTime = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now

    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={startTime}
      />
    )

    expect(screen.getByText(/Session starts in/)).toBeInTheDocument()
  })

  it('shows character counter', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
      />
    )

    expect(screen.getByText('0/100')).toBeInTheDocument()
  })

  it('updates character count as user types', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Hello world' } })

    // Character counter should update
    expect(screen.getByText('11/100')).toBeInTheDocument()
  })

  it('validates empty task - submit button should be disabled when input empty', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
      />
    )

    const submitButton = screen.getByText('Set Goal')
    expect(submitButton).toBeDisabled()
  })

  it('submits task when valid input provided', async () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
        onTaskSubmitted={mockOnTaskSubmitted}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'Complete my project' } })

    const submitButton = screen.getByText('Set Goal')
    fireEvent.click(submitButton)

    // Wait for async submit
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(mockSubmitTask).toHaveBeenCalledWith('Complete my project')
  })

  it('shows previous goal button when previousTask provided', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
        previousTask="Complete documentation"
      />
    )

    expect(screen.getByText(/Use previous goal/)).toBeInTheDocument()
  })

  it('populates input with previous task on use previous click', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
        previousTask="Complete documentation"
      />
    )

    const usePreviousButton = screen.getByText(/Use previous goal/)
    fireEvent.click(usePreviousButton)

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.value).toBe('Complete documentation')
  })

  it('closes on cancel button click', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
      />
    )

    const cancelButton = screen.getByText('Cancel')
    fireEvent.click(cancelButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('enforces 100 character limit on input', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
      />
    )

    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.maxLength).toBe(100)
  })

  it('shows placeholder text', () => {
    render(
      <TaskSubmissionModal
        open={true}
        onOpenChange={mockOnOpenChange}
        roomId={mockRoomId}
        sessionStartTime={mockSessionStartTime}
      />
    )

    const input = screen.getByPlaceholderText('e.g., Complete project documentation')
    expect(input).toBeInTheDocument()
  })
})
