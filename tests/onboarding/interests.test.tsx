import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { StepInterests } from '@/components/onboarding/StepInterests'
import { useOnboardingStore } from '@/lib/onboarding-store'

// Mock the onboarding store
vi.mock('@/lib/onboarding-store')

describe('StepInterests - Interest Tag Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Interest Tag Rendering', () => {
    it('should render all interest categories', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/occupation/i)).toBeInTheDocument()
      expect(screen.getByText(/goals/i)).toBeInTheDocument()
      expect(screen.getByText(/expertise level/i)).toBeInTheDocument()
    })

    it('should render occupation tags', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/student/i)).toBeInTheDocument()
      expect(screen.getByText(/developer/i)).toBeInTheDocument()
      expect(screen.getByText(/designer/i)).toBeInTheDocument()
      expect(screen.getByText(/writer/i)).toBeInTheDocument()
      expect(screen.getByText(/entrepreneur/i)).toBeInTheDocument()
      expect(screen.getByText(/researcher/i)).toBeInTheDocument()
      expect(screen.getByText(/freelancer/i)).toBeInTheDocument()
      expect(screen.getByText(/remote worker/i)).toBeInTheDocument()
    })

    it('should render goal tags', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/deep work/i)).toBeInTheDocument()
      expect(screen.getByText(/study sessions/i)).toBeInTheDocument()
      expect(screen.getByText(/creative projects/i)).toBeInTheDocument()
      expect(screen.getByText(/business building/i)).toBeInTheDocument()
      expect(screen.getByText(/learning/i)).toBeInTheDocument()
      expect(screen.getByText(/writing/i)).toBeInTheDocument()
      expect(screen.getByText(/research/i)).toBeInTheDocument()
      expect(screen.getByText(/job search/i)).toBeInTheDocument()
    })

    it('should render expertise level tags', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/beginner/i)).toBeInTheDocument()
      expect(screen.getByText(/intermediate/i)).toBeInTheDocument()
      expect(screen.getByText(/advanced/i)).toBeInTheDocument()
      expect(screen.getByText(/expert/i)).toBeInTheDocument()
    })
  })

  describe('Interest Selection', () => {
    it('should select a single interest tag', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData
      })

      render(<StepInterests />)

      const tag = screen.getByText(/developer/i)
      fireEvent.click(tag)

      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ interests: ['Developer'] })
      })
    })

    it('should select multiple interest tags', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData
      })

      render(<StepInterests />)

      fireEvent.click(screen.getByText(/developer/i))
      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ interests: ['Developer'] })
      })

      fireEvent.click(screen.getByText(/writer/i))
      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ interests: ['Developer', 'Writer'] })
      })

      fireEvent.click(screen.getByText(/intermediate/i))
      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ interests: ['Developer', 'Writer', 'Intermediate'] })
      })
    })

    it('should deselect a selected interest tag', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: ['Developer', 'Writer'] },
        updateData
      })

      render(<StepInterests />)

      const tag = screen.getByText(/developer/i)
      fireEvent.click(tag)

      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ interests: ['Writer'] })
      })
    })

    it('should display selected tags from store', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: ['Developer', 'Writer', 'Intermediate'] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      const developerTag = screen.getByText(/developer/i).closest('button')
      const writerTag = screen.getByText(/writer/i).closest('button')
      const intermediateTag = screen.getByText(/intermediate/i).closest('button')
      const studentTag = screen.getByText(/student/i).closest('button')

      // Selected tags should have active styling
      expect(developerTag).toHaveClass('bg-blue-500')
      expect(writerTag).toHaveClass('bg-blue-500')
      expect(intermediateTag).toHaveClass('bg-blue-500')

      // Unselected tags should not have active styling
      expect(studentTag).not.toHaveClass('bg-blue-500')
    })
  })

  describe('Tag Styling', () => {
    it('should apply unselected styling to unselected tags', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      const tag = screen.getByText(/student/i).closest('button')

      expect(tag).toHaveClass('bg-white')
      expect(tag).toHaveClass('border-gray-300')
    })

    it('should apply selected styling to selected tags', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: ['Student'] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      const tag = screen.getByText(/student/i).closest('button')

      expect(tag).toHaveClass('bg-blue-500')
      expect(tag).toHaveClass('text-white')
      expect(tag).toHaveClass('border-blue-500')
    })

    it('should apply hover state to unselected tags', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      const tag = screen.getByText(/student/i).closest('button')
      expect(tag).toHaveClass('hover:border-blue-500')
    })
  })

  describe('Selection Counter', () => {
    it('should display selection counter when tags are selected', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: ['Developer', 'Writer'] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/you selected 2 tags/i)).toBeInTheDocument()
    })

    it('should display singular "tag" for single selection', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: ['Developer'] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/you selected 1 tag/i)).toBeInTheDocument()
    })

    it('should display plural "tags" for multiple selections', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: ['Developer', 'Writer', 'Intermediate'] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/you selected 3 tags/i)).toBeInTheDocument()
    })

    it('should not display counter when no tags selected', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.queryByText(/you selected/i)).not.toBeInTheDocument()
    })

    it('should update counter in real-time as tags are selected/deselected', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData
      })

      render(<StepInterests />)

      // No tags selected
      expect(screen.queryByText(/you selected/i)).not.toBeInTheDocument()

      // Select one tag
      fireEvent.click(screen.getByText(/developer/i))
      await waitFor(() => {
        expect(screen.getByText(/you selected 1 tag/i)).toBeInTheDocument()
      })

      // Select another tag
      fireEvent.click(screen.getByText(/writer/i))
      await waitFor(() => {
        expect(screen.getByText(/you selected 2 tags/i)).toBeInTheDocument()
      })

      // Deselect a tag
      fireEvent.click(screen.getByText(/developer/i))
      await waitFor(() => {
        expect(screen.getByText(/you selected 1 tag/i)).toBeInTheDocument()
      })
    })
  })

  describe('UI Elements', () => {
    it('should render step title', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/your interests/i)).toBeInTheDocument()
    })

    it('should render explanatory text', () => {
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData: vi.fn()
      })

      render(<StepInterests />)

      expect(screen.getByText(/select tags that describe you/i)).toBeInTheDocument()
      expect(screen.getByText(/helps us match you/i)).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle selecting all tags', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: [] },
        updateData
      })

      render(<StepInterests />)

      // Select all tags (20 total)
      const allTags = screen.getAllByRole('button')
      allTags.forEach(tag => fireEvent.click(tag))

      await waitFor(() => {
        expect(updateData).toHaveBeenCalled()
      })
    })

    it('should handle deselecting all tags', async () => {
      const updateData = vi.fn()
      ;(useOnboardingStore as any).mockReturnValue({
        data: { interests: ['Developer', 'Writer', 'Intermediate'] },
        updateData
      })

      render(<StepInterests />)

      fireEvent.click(screen.getByText(/developer/i))
      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ interests: ['Writer', 'Intermediate'] })
      })

      fireEvent.click(screen.getByText(/writer/i))
      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ interests: ['Intermediate'] })
      })

      fireEvent.click(screen.getByText(/intermediate/i))
      await waitFor(() => {
        expect(updateData).toHaveBeenCalledWith({ interests: [] })
      })

      expect(screen.queryByText(/you selected/i)).not.toBeInTheDocument()
    })
  })
})
