import mongoose, { Schema, Model } from 'mongoose'
import { GridFSBucket } from 'mongodb'
import { IUser } from './types'

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    select: false  // Don't return password by default
  },
  name: {
    type: String,
    required: true
  },
  photoId: {
    type: Schema.Types.ObjectId
  },
  photoUrl: {
    type: String
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  interests: [{
    type: String,
    trim: true
  }],
  isOnboarded: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active',
    index: true
  },
  subscription: {
    type: {
      tier: { type: String, enum: ['free', 'weekly', 'monthly'], default: 'free' },
      sessionsUsed: { type: Number, default: 0 },
      sessionsLimit: { type: Number, default: 2 }, // Free tier: 2 sessions
      startDate: { type: Date },
      nextBillingDate: { type: Date },
      razorpaySubscriptionId: { type: String },
      razorpayPlanId: { type: String }
    },
    default: {}
  },
  banReason: {
    type: String,
    trim: true
  },
  banExpiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
})

// Prevent model recompilation in hot reload
export const User = (mongoose.models.User as Model<IUser>) ||
  mongoose.model<IUser>('User', UserSchema)

// GridFS bucket for photo storage
export const getPhotoBucket = (): GridFSBucket => {
  const db = mongoose.connection.db
  if (!db) {
    throw new Error('Database not connected')
  }
  return new GridFSBucket(db, { bucketName: 'profilePhotos' })
}
