import mongoose, { Schema, Model } from 'mongoose'
import { IInterestTag } from './types'

const InterestTagSchema = new Schema<IInterestTag>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
})

// Prevent model recompilation in hot reload
export const InterestTag = (mongoose.models.InterestTag as Model<IInterestTag>) ||
  mongoose.model<IInterestTag>('InterestTag', InterestTagSchema)

export { InterestTagSchema }
