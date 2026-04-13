import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StepNamePhoto } from '@/components/onboarding/StepNamePhoto'
import { useOnboardingStore } from '@/lib/onboarding-store'

// Mock the onboarding store
vi.mock('@/lib/onboarding-store')

// Mock fetch for photo upload
global.fetch = vi.fn()

describe('StepNamePhoto - Profile Creation', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Default store mock
    ;(useOnboardingStore as any).mockReturnValue({
      data: {
        name: '',
        photoUrl: null
      },
      updateData: vi.fn()
    })
  })

  describe('Name Input', () => {
    it('should render name input field', () => {
      render(<StepNamePhoto />)

      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument()
    })

    it('should accept name input', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: '', photoUrl: null },
        updateData
      })

      render(<StepNamePhoto />)

      const nameInput = screen.getByLabelText(/your name/i)
      fireEvent.change(nameInput, { target: { value: 'John Doe' } })

      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ name: 'John Doe' })
      })
    })

    it('should display current name from store', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: 'Jane Doe', photoUrl: null },
        updateData: vi.fn()
      })

      render(<StepNamePhoto />)

      const nameInput = screen.getByLabelText(/your name/i) as HTMLInputElement
      expect(nameInput.value).toBe('Jane Doe')
    })

    it('should update name when user types', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: '', photoUrl: null },
        updateData
      })

      render(<StepNamePhoto />)

      const nameInput = screen.getByLabelText(/your name/i)
      fireEvent.change(nameInput, { target: { value: 'Alice' } })

      await waitFor(() => {
        expect(nameInput).toHaveValue('Alice')
      })
    })
  })

  describe('Photo Upload', () => {
    it('should render photo upload input', () => {
      render(<StepNamePhoto />)

      expect(screen.getByLabelText(/profile photo/i)).toBeInTheDocument()
    })

    it('should show photo preview after selection', async () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: '', photoUrl: null },
        updateData: vi.fn()
      })

      render(<StepNamePhoto />)

      const fileInput = screen.getByLabelText(/profile photo/i)
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        const preview = screen.getByAltText(/preview/i)
        expect(preview).toBeInTheDocument()
        expect(preview).toHaveClass('w-24 h-24 rounded-full object-cover')
      })
    })

    it('should upload photo to server', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: '', photoUrl: null },
        updateData
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          photoId: 'photo-123',
          photoUrl: 'https://example.com/photo.jpg'
        })
      })

      render(<StepNamePhoto />)

      const fileInput = screen.getByLabelText(/profile photo/i)
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/upload/photo', {
          method: 'POST',
          body: expect.any(FormData)
        })
      })

      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({
          photoFile: file,
          photoId: 'photo-123',
          photoUrl: 'https://example.com/photo.jpg'
        })
      })
    })

    it('should show uploading state during upload', async () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: '', photoUrl: null },
        updateData: vi.fn()
      })

      // Mock a slow upload
      let resolveUpload: any
      ;(global.fetch as any).mockReturnValue(new Promise((resolve) => {
        resolveUpload = resolve
      }))

      render(<StepNamePhoto />)

      const fileInput = screen.getByLabelText(/profile photo/i)
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument()
      })

      // Resolve upload
      resolveUpload({
        ok: true,
        json: async () => ({
          success: true,
          photoId: 'photo-123',
          photoUrl: 'https://example.com/photo.jpg'
        })
      })

      await waitFor(() => {
        expect(screen.queryByText(/uploading/i)).not.toBeInTheDocument()
      })
    })

    it('should handle upload error gracefully', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: '', photoUrl: null },
        updateData: vi.fn()
      })

      ;(global.fetch as any).mockRejectedValue(new Error('Upload failed'))

      render(<StepNamePhoto />)

      const fileInput = screen.getByLabelText(/profile photo/i)
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Failed to upload photo. Please try again.')
      })

      alertMock.mockRestore()
    })

    it('should handle server error response', async () => {
      const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {})

      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: '', photoUrl: null },
        updateData: vi.fn()
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        json: async () => ({
          error: 'Invalid file type'
        })
      })

      render(<StepNamePhoto />)

      const fileInput = screen.getByLabelText(/profile photo/i)
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(alertMock).toHaveBeenCalledWith('Invalid file type')
      })

      alertMock.mockRestore()
    })

    it('should disable input during upload', async () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { name: '', photoUrl: null },
        updateData: vi.fn()
      })

      let resolveUpload: any
      ;(global.fetch as any).mockReturnValue(new Promise((resolve) => {
        resolveUpload = resolve
      }))

      render(<StepNamePhoto />)

      const fileInput = screen.getByLabelText(/profile photo/i) as HTMLInputElement
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      await waitFor(() => {
        expect(fileInput.disabled).toBe(true)
      })

      resolveUpload({
        ok: true,
        json: async () => ({
          success: true,
          photoId: 'photo-123',
          photoUrl: 'https://example.com/photo.jpg'
        })
      })

      await waitFor(() => {
        expect(fileInput.disabled).toBe(false)
      })
    })
  })

  describe('Photo Display', () => {
    it('should display existing photo from store', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: {
          name: 'John Doe',
          photoUrl: 'https://example.com/existing.jpg'
        },
        updateData: vi.fn()
      })

      render(<StepNamePhoto />)

      const preview = screen.getByAltText(/preview/i)
      expect(preview).toBeInTheDocument()
      expect(preview).toHaveAttribute('src', 'https://example.com/existing.jpg')
    })
  })
})
