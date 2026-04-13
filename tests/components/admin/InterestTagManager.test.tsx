import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { toast } from 'sonner'
import { InterestTagManager } from '@/components/admin/InterestTagManager'
import { IInterestTag } from '@/models/types'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock fetch
global.fetch = vi.fn()

const mockTags: IInterestTag[] = [
  {
    _id: '1' as any,
    name: 'coding',
    description: 'Programming and development',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '2' as any,
    name: 'writing',
    description: 'Creative and academic writing',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: '3' as any,
    name: 'learning',
    description: 'Study and learning sessions',
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

describe('InterestTagManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock successful API responses
    ;(global.fetch as any).mockImplementation((url: string) => {
      if (url === '/api/admin/tags') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, tags: mockTags })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, tag: {} })
      })
    })
  })

  it('should render tag list', async () => {
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
      expect(screen.getByText('writing')).toBeInTheDocument()
      expect(screen.getByText('learning')).toBeInTheDocument()
    })
  })

  it('should show loading state initially', () => {
    ;(global.fetch as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true, tags: [] })
      }), 100))
    )

    render(<InterestTagManager />)

    // Should show loading spinner
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should show empty state when no tags', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, tags: [] })
    })

    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('No tags found')).toBeInTheDocument()
    })
  })

  it('should open add tag dialog', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add tag/i })
    await user.click(addButton)

    expect(screen.getByText('Add Interest Tag')).toBeInTheDocument()
  })

  it('should create new tag', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Open add dialog
    const addButton = screen.getByRole('button', { name: /add tag/i })
    await user.click(addButton)

    // Fill form
    const nameInput = screen.getByLabelText('Name *')
    await user.type(nameInput, 'design')

    const descriptionInput = screen.getByLabelText('Description')
    await user.type(descriptionInput, 'UI/UX and graphic design')

    // Submit
    const createButton = screen.getByRole('button', { name: /create tag/i })
    await user.click(createButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/tags',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('design')
        })
      )
    })
  })

  it('should validate tag name is required', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add tag/i })
    await user.click(addButton)

    // Try to submit without name
    const createButton = screen.getByRole('button', { name: /create tag/i })
    expect(createButton).toBeDisabled()
  })

  it('should open edit dialog for existing tag', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Find edit button for first tag
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => btn.querySelector('svg'))

    if (editButton) {
      await user.click(editButton)

      expect(screen.getByText('Edit Interest Tag')).toBeInTheDocument()
      expect(screen.getByDisplayValue('coding')).toBeInTheDocument()
    }
  })

  it('should update existing tag', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Open edit dialog
    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => btn.querySelector('svg'))

    if (editButton) {
      await user.click(editButton)

      // Update name
      const nameInput = screen.getByDisplayValue('coding')
      await user.clear(nameInput)
      await user.type(nameInput, 'programming')

      // Submit
      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/tags/1',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.stringContaining('programming')
          })
        )
      })
    }
  })

  it('should open delete confirmation dialog', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Find and click delete button (second icon button)
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1] // Last button should be delete

    await user.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete Interest Tag?')).toBeInTheDocument()
    })
  })

  it('should delete tag with confirmation', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Open delete dialog
    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await user.click(deleteButton)

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete tag/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/tags/1',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })

  it('should toggle tag active status', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Find toggle button (first icon button for each tag)
    const toggleButton = screen.getAllByRole('button')[0]
    await user.click(toggleButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/tags/1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('isActive')
        })
      )
    })
  })

  it('should filter tags by active status', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Click "active" filter
    const activeFilter = screen.getByRole('button', { name: 'active' })
    await user.click(activeFilter)

    // Should only show active tags
    expect(screen.getByText('coding')).toBeInTheDocument()
    expect(screen.queryByText('learning')).not.toBeInTheDocument()
  })

  it('should filter tags by inactive status', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Click "inactive" filter
    const inactiveFilter = screen.getByRole('button', { name: 'inactive' })
    await user.click(inactiveFilter)

    // Should only show inactive tags
    expect(screen.getByText('learning')).toBeInTheDocument()
    expect(screen.queryByText('coding')).not.toBeInTheDocument()
  })

  it('should show all tags when "all" filter selected', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    // Click "active" filter first
    const activeFilter = screen.getByRole('button', { name: 'active' })
    await user.click(activeFilter)

    // Then click "all"
    const allFilter = screen.getByRole('button', { name: 'all' })
    await user.click(allFilter)

    // Should show all tags
    expect(screen.getByText('coding')).toBeInTheDocument()
    expect(screen.getByText('learning')).toBeInTheDocument()
  })

  it('should show success toast on create', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add tag/i })
    await user.click(addButton)

    const nameInput = screen.getByLabelText('Name *')
    await user.type(nameInput, 'design')

    const createButton = screen.getByRole('button', { name: /create tag/i })
    await user.click(createButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Tag created successfully')
    })
  })

  it('should show success toast on update', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button')
    const editButton = editButtons.find(btn => btn.querySelector('svg'))

    if (editButton) {
      await user.click(editButton)

      const saveButton = screen.getByRole('button', { name: /save changes/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Tag updated successfully')
      })
    }
  })

  it('should show success toast on delete', async () => {
    const user = userEvent.setup()
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    const buttons = screen.getAllByRole('button')
    const deleteButton = buttons[buttons.length - 1]
    await user.click(deleteButton)

    const confirmButton = screen.getByRole('button', { name: /delete tag/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Tag deleted successfully')
    })
  })

  it('should show error toast on failure', async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to create tag' })
    })

    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('coding')).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add tag/i })
    await user.click(addButton)

    const nameInput = screen.getByLabelText('Name *')
    await user.type(nameInput, 'design')

    const createButton = screen.getByRole('button', { name: /create tag/i })
    await user.click(createButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to create tag')
    })
  })

  it('should display tag descriptions', async () => {
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('Programming and development')).toBeInTheDocument()
      expect(screen.getByText('Creative and academic writing')).toBeInTheDocument()
    })
  })

  it('should display active/inactive status badges', async () => {
    render(<InterestTagManager />)

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })
  })
})
