"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, AlertTriangle } from "lucide-react"

export type BanAction = "ban" | "suspend" | "unban"
export type BanDuration = "1day" | "1week" | "1month" | "permanent"

export interface UserForModal {
  id: string
  name: string
  email: string
  status: "active" | "suspended" | "banned"
}

interface BanSuspendModalProps {
  user: UserForModal
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function BanSuspendModal({
  user,
  open,
  onClose,
  onSuccess,
}: BanSuspendModalProps) {
  const [action, setAction] = useState<BanAction>(() => {
    // Pre-select action based on current status
    if (user.status === "banned") return "unban"
    if (user.status === "suspended") return "unban"
    return "ban" // default for active users
  })
  const [duration, setDuration] = useState<BanDuration>("1week")
  const [reason, setReason] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const isUnban = action === "unban"
  const isBan = action === "ban"
  const isSuspend = action === "suspend"

  // Reset form when user changes
  const handleUserChange = () => {
    setAction(user.status === "banned" || user.status === "suspended" ? "unban" : "ban")
    setDuration("1week")
    setReason("")
    setError(null)
    setShowConfirm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Reason must be at least 10 characters long")
      return
    }

    if (!isUnban && !duration) {
      setError("Please select a duration")
      return
    }

    // Show confirmation if not already shown
    if (!showConfirm) {
      setShowConfirm(true)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: isUnban ? "unban" : action,
          reason: reason.trim(),
          duration: isUnban ? undefined : duration,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to update user status")
        setIsSubmitting(false)
        setShowConfirm(false)
        return
      }

      // Success - close modal and notify parent
      onSuccess()
      handleClose()
    } catch (err) {
      setError("Network error. Please try again.")
      setIsSubmitting(false)
      setShowConfirm(false)
    }
  }

  const handleClose = () => {
    setAction(user.status === "banned" || user.status === "suspended" ? "unban" : "ban")
    setDuration("1week")
    setReason("")
    setError(null)
    setShowConfirm(false)
    onClose()
  }

  const getActionText = () => {
    if (isUnban) {
      return user.status === "banned" ? "Unban User" : "Unsuspend User"
    }
    return isBan ? "Ban User" : "Suspend User"
  }

  const getActionDescription = () => {
    if (isUnban) {
      return user.status === "banned"
        ? "This will allow the user to access their account again."
        : "This will lift the suspension and restore full access."
    }
    return isBan
      ? "This will permanently or temporarily revoke the user's access."
      : "This will temporarily restrict the user's access."
  }

  const getStatusText = () => {
    if (isUnban) return "Active"
    if (isBan) return "Banned"
    return "Suspended"
  }

  const getDurationText = () => {
    if (isUnban) return "N/A"
    switch (duration) {
      case "1day":
        return "1 day"
      case "1week":
        return "1 week"
      case "1month":
        return "1 month"
      case "permanent":
        return "Permanent"
      default:
        return ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className={isBan ? "text-destructive" : ""}>
            {getActionText()}
          </DialogTitle>
          <DialogDescription>
            {getActionDescription()} User: <strong>{user.name}</strong> ({user.email})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Action Type */}
            <div className="grid gap-2">
              <Label htmlFor="action">Action</Label>
              <Select
                value={action}
                onValueChange={(value) => setAction(value as BanAction)}
              >
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ban">Ban</SelectItem>
                  <SelectItem value="suspend">Suspend</SelectItem>
                  <SelectItem value="unban">
                    {user.status === "banned" ? "Unban" : "Unsuspend"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Duration (not shown for unban) */}
            {!isUnban && (
              <div className="grid gap-2">
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={duration}
                  onValueChange={(value) => setDuration(value as BanDuration)}
                >
                  <SelectTrigger id="duration">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1day">1 day</SelectItem>
                    <SelectItem value="1week">1 week</SelectItem>
                    <SelectItem value="1month">1 month</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Reason */}
            <div className="grid gap-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Provide a detailed reason for this action..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                minLength={10}
              />
              {reason.length > 0 && reason.length < 10 && (
                <p className="text-xs text-destructive">
                  Reason must be at least 10 characters ({reason.length}/10)
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* Confirmation Warning */}
            {showConfirm && (
              <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Confirm Action
                    </p>
                    <div className="mt-1 text-yellow-700 dark:text-yellow-300 space-y-1">
                      <p>You are about to:</p>
                      <ul className="list-disc list-inside ml-2">
                        <li>
                          <strong>Action:</strong> {getActionText()}
                        </li>
                        {!isUnban && (
                          <li>
                            <strong>Duration:</strong> {getDurationText()}
                          </li>
                        )}
                        <li>
                          <strong>New Status:</strong> {getStatusText()}
                        </li>
                        <li>
                          <strong>Reason:</strong> {reason.trim()}
                        </li>
                      </ul>
                      <p className="mt-2">This action will be logged.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isBan ? "destructive" : "default"}
              disabled={isSubmitting || !reason.trim() || reason.trim().length < 10}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : showConfirm ? (
                "Confirm"
              ) : (
                getActionText()
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
