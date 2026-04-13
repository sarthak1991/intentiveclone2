import mongoose, { Schema, Model } from 'mongoose'

export interface IStreak {
  userId: mongoose.Types.ObjectId
  currentStreak: number
  longestStreak: number
  lastSessionDate: Date | null
  createdAt: Date
  updatedAt: Date
}

const StreakSchema = new Schema<IStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastSessionDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
StreakSchema.index({ userId: 1 })

// Prevent model recompiling in hot reload
export const Streak =
  (mongoose.models.Streak as Model<IStreak>) ||
  mongoose.model<IStreak>('Streak', StreakSchema)

export { StreakSchema }
