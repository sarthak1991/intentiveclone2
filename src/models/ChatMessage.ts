import mongoose, { Schema, Model } from 'mongoose'
import { IChatMessage } from './types'

const ChatMessageSchema = new Schema<IChatMessage>({
  roomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userName: {
    type: String,
    required: true
  },
  userPhoto: {
    type: String
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
})

// Compound index for efficient room message queries
// Query pattern: find messages for a room, sorted by timestamp descending
ChatMessageSchema.index({ roomId: 1, timestamp: -1 })

// Prevent model recompilation in hot reload
export const ChatMessage = (mongoose.models.ChatMessage as Model<IChatMessage>) ||
  mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema)

export { ChatMessageSchema }
