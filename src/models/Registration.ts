import mongoose, { Schema, Model } from 'mongoose'
import { IRegistration } from './types'

const RegistrationSchema = new Schema<IRegistration>({
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
  registeredAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['registered', 'cancelled', 'no-show', 'attended'],
    default: 'registered',
    index: true
  },
  attendedAt: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  noShowAlertSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Compound unique index to prevent duplicate registrations
RegistrationSchema.index({ userId: 1, roomId: 1 }, { unique: true })

// Index for time-based queries
RegistrationSchema.index({ registeredAt: 1 })

// Prevent model recompilation in hot reload
export const Registration = (mongoose.models.Registration as Model<IRegistration>) ||
  mongoose.model<IRegistration>('Registration', RegistrationSchema)

export { RegistrationSchema }
