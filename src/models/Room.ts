import mongoose, { Schema, Model } from 'mongoose'
import { IRoom } from './types'

const RoomSchema = new Schema<IRoom>({
  title: {
    type: String,
    default: 'Focus Room'
  },
  scheduledTime: {
    type: Date,
    required: true,
    index: true
  },
  duration: {
    type: Number,
    default: 45,
    min: 1
  },
  capacity: {
    type: Number,
    default: 12,
    min: 1,
    max: 12
  },
  status: {
    type: String,
    enum: ['scheduled', 'open', 'full', 'in-progress', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  waitlist: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  interestTags: [{
    type: String,
    trim: true
  }],
  parentRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room'
  },
  overflowRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  isOverflowRoom: {
    type: Boolean,
    default: false
  },
  captainId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  }
}, {
  timestamps: true
})

// Compound index for querying today's rooms by scheduled time and status
RoomSchema.index({ scheduledTime: 1, status: 1 })

// Compound index for querying rooms by scheduled time and overflow room status
RoomSchema.index({ scheduledTime: 1, isOverflowRoom: 1 })

// Prevent model recompilation in hot reload
export const Room = (mongoose.models.Room as Model<IRoom>) ||
  mongoose.model<IRoom>('Room', RoomSchema)

export { RoomSchema }
