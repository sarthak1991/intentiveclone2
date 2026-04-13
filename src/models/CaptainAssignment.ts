import mongoose, { Schema, Model } from 'mongoose'

export interface ICaptainAssignment {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  assignedBy: mongoose.Types.ObjectId
  assignedAt: Date
  status: 'invited' | 'accepted' | 'declined' | 'removed'
  sessionsCaptained: number
  freeSessionsEarned: number
  remarks?: string
  createdAt: Date
  updatedAt: Date
}

const CaptainAssignmentSchema = new Schema<ICaptainAssignment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true,
      index: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['invited', 'accepted', 'declined', 'removed'],
      default: 'invited',
      required: true,
    },
    sessionsCaptained: {
      type: Number,
      default: 0,
    },
    freeSessionsEarned: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
)

// Compound unique index on userId + roomId (one assignment per user per room)
CaptainAssignmentSchema.index({ userId: 1, roomId: 1 }, { unique: true })

// Index for queries by assignedBy (admin)
CaptainAssignmentSchema.index({ assignedBy: 1 })

// Prevent model recompiling in hot reload
export const CaptainAssignment =
  (mongoose.models.CaptainAssignment as Model<ICaptainAssignment>) ||
  mongoose.model<ICaptainAssignment>('CaptainAssignment', CaptainAssignmentSchema)

export { CaptainAssignmentSchema }
