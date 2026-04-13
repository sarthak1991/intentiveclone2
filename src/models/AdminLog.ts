import mongoose, { Schema, Model } from 'mongoose'
import { IAdminLog } from './types'

/**
 * AdminLog Schema
 * Tracks administrative actions for audit trail
 */
const AdminLogSchema = new Schema<IAdminLog>(
  {
    adminId: {
      type: String,
      required: true,
      index: true
    },
    adminName: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user_blocked',
        'user_unblocked',
        'user_banned',
        'user_unbanned',
        'user_suspended',
        'user_unsuspended',
        'room_created',
        'room_updated',
        'room_cancelled',
        'captain_assigned',
        'captain_removed',
        'settings_updated',
        'announcement_sent',
        'view_logs'
      ]
    },
    targetUserId: {
      type: String,
      index: true
    },
    targetRoomId: {
      type: String,
      index: true
    },
    reason: {
      type: String,
      required: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: 'admin_logs'
  }
)

// Index for querying logs by date range and action type
AdminLogSchema.index({ createdAt: -1, action: 1 })

// Index for querying logs by admin
AdminLogSchema.index({ adminId: 1, createdAt: -1 })

const AdminLog: Model<IAdminLog> =
  (mongoose.models.AdminLog as Model<IAdminLog>) ||
  mongoose.model<IAdminLog>('AdminLog', AdminLogSchema)

export default AdminLog
