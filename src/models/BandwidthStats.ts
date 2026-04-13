import mongoose, { Schema } from 'mongoose'

/**
 * Bandwidth statistics tracking model
 * Tracks daily bandwidth usage for TURN relay vs direct P2P connections
 * Enables cost monitoring and quota management
 */

export interface IBandwidthStats {
  date: Date  // Day boundary (start of day)
  roomId: mongoose.Types.ObjectId
  bytesRelayed: number  // TURN relay bytes (costs money)
  bytesDirect: number  // P2P direct bytes (free)
  transportCount: number  // Number of transports created
  participantMinutes: number  // Total participant-minutes in session
  estimatedCost: number  // USD, based on relay bytes
  relayVsDirectRatio: number  // bytesRelayed / (bytesRelayed + bytesDirect)
  createdAt: Date
  updatedAt: Date
}

const BandwidthStatsSchema = new Schema<IBandwidthStats>(
  {
    date: {
      type: Date,
      required: true,
      index: true
    },
    roomId: {
      type: Schema.Types.ObjectId,
      ref: 'Room',
      required: true
    },
    bytesRelayed: {
      type: Number,
      default: 0
    },
    bytesDirect: {
      type: Number,
      default: 0
    },
    transportCount: {
      type: Number,
      default: 0
    },
    participantMinutes: {
      type: Number,
      default: 0
    },
    estimatedCost: {
      type: Number,
      default: 0
    },
    relayVsDirectRatio: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

// Compound unique index on date + roomId (one record per room per day)
BandwidthStatsSchema.index({ date: 1, roomId: 1 }, { unique: true })

// Index on date for time-range queries
BandwidthStatsSchema.index({ date: -1 })

// Hot-reload protection
export const BandwidthStats =
  (mongoose.models.BandwidthStats as mongoose.Model<IBandwidthStats>) ||
  mongoose.model<IBandwidthStats>('BandwidthStats', BandwidthStatsSchema)
