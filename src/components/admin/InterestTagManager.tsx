'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { IInterestTag } from '@/models/types'

interface InterestTagManagerProps {
  onClose?: () => void
}

type FilterType = 'all' | 'active' | 'inactive'

export function InterestTagManager({ onClose }: InterestTagManagerProps) {
  const [tags, setTags] = useState<IInterestTag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<IInterestTag | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  })

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      const response = await fetch('/api/admin/tags')
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch tags')
      }

      setTags(result.tags)
    } catch (error) {
      console.error('Error fetching tags:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch tags')
    } finally {
      setIsLoading(false)
    }
  }

  function openAddDialog() {
    setFormData({ name: '', description: '', isActive: true })
    setIsAddDialogOpen(true)
  }

  function openEditDialog(tag: IInterestTag) {
    setSelectedTag(tag)
    setFormData({
      name: tag.name,
      description: tag.description || '',
      isActive: tag.isActive
    })
    setIsEditDialogOpen(true)
  }

  function openDeleteDialog(tag: IInterestTag) {
    setSelectedTag(tag)
    setIsDeleteDialogOpen(true)
  }

  async function handleCreateTag() {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create tag')
      }

      toast.success('Tag created successfully')
      setIsAddDialogOpen(false)
      fetchTags()
    } catch (error) {
      console.error('Error creating tag:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleUpdateTag() {
    if (!selectedTag) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/tags/${selectedTag._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update tag')
      }

      toast.success('Tag updated successfully')
      setIsEditDialogOpen(false)
      setSelectedTag(null)
      fetchTags()
    } catch (error) {
      console.error('Error updating tag:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteTag() {
    if (!selectedTag) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/tags/${selectedTag._id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete tag')
      }

      toast.success('Tag deleted successfully')
      setIsDeleteDialogOpen(false)
      setSelectedTag(null)
      fetchTags()
    } catch (error) {
      console.error('Error deleting tag:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete tag')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleActive(tag: IInterestTag) {
    try {
      const response = await fetch(`/api/admin/tags/${tag._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !tag.isActive })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update tag')
      }

      toast.success(`Tag ${tag.isActive ? 'deactivated' : 'activated'} successfully`)
      fetchTags()
    } catch (error) {
      console.error('Error toggling tag:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update tag')
    }
  }

  const filteredTags = tags.filter(tag => {
    if (filter === 'all') return true
    if (filter === 'active') return tag.isActive
    if (filter === 'inactive') return !tag.isActive
    return true
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Interest Tags</h3>
        <Button size="sm" onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {/* Filter controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Filter:</span>
        {(['all', 'active', 'inactive'] as FilterType[]).map(filterType => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 py-1 rounded-full text-sm capitalize ${
              filter === filterType
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filterType}
          </button>
        ))}
      </div>

      {/* Tags list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : filteredTags.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <p className="text-gray-500 mb-2">No tags found</p>
          <p className="text-sm text-gray-400">
            {filter !== 'all' ? 'Try changing the filter' : 'Create a new tag to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTags.map((tag) => (
            <div
              key={tag._id.toString()}
              className="flex items-center justify-between p-4 bg-white border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tag.name}</span>
                  <Badge variant={tag.isActive ? 'default' : 'secondary'}>
                    {tag.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {tag.description && (
                  <p className="text-sm text-gray-500 mt-1">{tag.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggleActive(tag)}
                  title={tag.isActive ? 'Deactivate' : 'Activate'}
                >
                  {tag.isActive ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditDialog(tag)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => openDeleteDialog(tag)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add tag dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Interest Tag</DialogTitle>
            <DialogDescription>
              Create a new interest tag for grouping rooms by topic.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., coding, writing, learning"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Input
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the tag"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTag} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit tag dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setSelectedTag(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Interest Tag</DialogTitle>
            <DialogDescription>
              Update the interest tag details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={isSubmitting}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <Label htmlFor="edit-isActive" className="text-sm cursor-pointer">
                Active (available for room assignment)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedTag(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTag} disabled={isSubmitting || !formData.name.trim()}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        setIsDeleteDialogOpen(open)
        if (!open) setSelectedTag(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Interest Tag?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{selectedTag?.name}</strong>?
              This tag will be removed from all rooms that use it.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedTag(null)
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteTag}
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
