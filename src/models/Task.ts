import mongoose, { Schema, Model } from 'mongoose'
import { ITask } from './types'

const TaskSchema = new Schema<ITask>({
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
  taskText: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  carriedOver: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Compound unique index to prevent duplicate tasks per user per room
TaskSchema.index({ userId: 1, roomId: 1 }, { unique: true })

// Index for time-based queries
TaskSchema.index({ submittedAt: -1 })

// Prevent model recompiling in hot reload
export const Task = (mongoose.models.Task as Model<ITask>) ||
  mongoose.model<ITask>('Task', TaskSchema)

export { TaskSchema }
