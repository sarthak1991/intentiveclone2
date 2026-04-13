import mongoose, { Schema, Model } from 'mongoose'
import { ISessionCompletion } from './types'

const SessionCompletionSchema = new Schema<ISessionCompletion>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  completed: {
    type: Boolean,
    required: true
  },
  incompleteReason: {
    type: String,
    trim: true
  },
  attendedAt: {
    type: Date
  },
  taskCompletedAt: {
    type: Date
  }
}, {
  timestamps: true
})

// Compound index for querying user's session completions
SessionCompletionSchema.index({ userId: 1, roomId: 1 })

// Index for filtering by completion status
SessionCompletionSchema.index({ completed: 1 })

// Prevent model recompiling in hot reload
export const SessionCompletion = (mongoose.models.SessionCompletion as Model<ISessionCompletion>) ||
  mongoose.model<ISessionCompletion>('SessionCompletion', SessionCompletionSchema)

export { SessionCompletionSchema }
