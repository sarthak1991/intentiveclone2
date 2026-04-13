import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ChatBox } from '@/components/room/ChatBox'
import { useRoomStore } from '@/store/roomStore'

// jsdom does not implement scrollIntoView — mock it globally
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// ============================================================================
// Mocks
// ============================================================================

const mockSendMessage = vi.fn()

vi.mock('@/hooks/useRoomChat', () => ({
  useRoomChat: () => ({ sendMessage: mockSendMessage }),
}))

// Mock date-fns format to return a stable time string
vi.mock('date-fns', () => ({
  format: vi.fn(() => '3:00 PM'),
}))

// ============================================================================
// Tests
// ============================================================================

describe('ChatBox', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useRoomStore.getState().reset()
  })

  it('renders "No messages yet" when no messages', () => {
    useRoomStore.setState({ isConnected: true })
    render(<ChatBox roomId="room-1" />)
    expect(screen.getByText(/No messages yet/i)).toBeInTheDocument()
  })

  it('displays messages with sender name and formatted time', () => {
    useRoomStore.setState({
      isConnected: true,
      messages: [
        {
          messageId: 'msg-1',
          userId: 'u1',
          userName: 'Alice',
          message: 'Hello there!',
          timestamp: new Date().toISOString(),
        },
      ],
    })

    render(<ChatBox roomId="room-1" />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Hello there!')).toBeInTheDocument()
    expect(screen.getByText('3:00 PM')).toBeInTheDocument()
  })

  it('clicking Send button calls sendMessage', () => {
    useRoomStore.setState({ isConnected: true })
    render(<ChatBox roomId="room-1" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Hello!' } })

    const sendButton = screen.getByRole('button', { name: /send/i })
    fireEvent.click(sendButton)

    expect(mockSendMessage).toHaveBeenCalledWith('Hello!')
  })

  it('pressing Enter calls sendMessage', () => {
    useRoomStore.setState({ isConnected: true })
    render(<ChatBox roomId="room-1" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Enter message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    expect(mockSendMessage).toHaveBeenCalledWith('Enter message')
  })

  it('clears input after sending', () => {
    useRoomStore.setState({ isConnected: true })
    render(<ChatBox roomId="room-1" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Clear me' } })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    expect((input as HTMLInputElement).value).toBe('')
  })

  it('disables input and Send button when not connected', () => {
    // isConnected is false by default
    render(<ChatBox roomId="room-1" />)

    const input = screen.getByPlaceholderText('Connecting...')
    expect(input).toBeDisabled()

    const sendButton = screen.getByRole('button', { name: /send/i })
    expect(sendButton).toBeDisabled()
  })

  it('shows character count when input exceeds 400 characters', () => {
    useRoomStore.setState({ isConnected: true })
    render(<ChatBox roomId="room-1" />)

    const input = screen.getByPlaceholderText('Type a message...')
    const longText = 'a'.repeat(401)
    fireEvent.change(input, { target: { value: longText } })

    expect(screen.getByText('401/500 characters')).toBeInTheDocument()
  })

  it('does not show character count when input is 400 chars or fewer', () => {
    useRoomStore.setState({ isConnected: true })
    render(<ChatBox roomId="room-1" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'a'.repeat(400) } })

    expect(screen.queryByText(/\/500 characters/i)).not.toBeInTheDocument()
  })

  it('does not send empty or whitespace-only messages', () => {
    useRoomStore.setState({ isConnected: true })
    render(<ChatBox roomId="room-1" />)

    const input = screen.getByPlaceholderText('Type a message...')

    // Empty input — button should be disabled
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()

    // Whitespace only — type spaces
    fireEvent.change(input, { target: { value: '   ' } })
    // Button remains disabled because trimmed value is empty
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()

    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('does not call sendMessage when pressing Shift+Enter', () => {
    useRoomStore.setState({ isConnected: true })
    render(<ChatBox roomId="room-1" />)

    const input = screen.getByPlaceholderText('Type a message...')
    fireEvent.change(input, { target: { value: 'Shift enter message' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(mockSendMessage).not.toHaveBeenCalled()
  })
})
