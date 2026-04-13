import mongoose from 'mongoose'

export interface IUser {
  _id: mongoose.Types.ObjectId
  email: string
  password?: string  // Optional for OAuth/magic link users
  name: string
  photoId?: mongoose.Types.ObjectId  // GridFS file ID
  photoUrl?: string  // Public URL for photo
  timezone: string
  interests: string[]
  isOnboarded: boolean
  role: 'user' | 'admin'
  status: 'active' | 'suspended' | 'banned'
  banReason?: string
  banExpiresAt?: Date
  subscription?: {
    tier: 'free' | 'weekly' | 'monthly'
    sessionsUsed: number
    sessionsLimit: number
    startDate?: Date
    nextBillingDate?: Date
    razorpaySubscriptionId?: string
    razorpayPlanId?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface ISession {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  token: string
  expiresAt: Date
  createdAt: Date
}

export interface IRoom {
  _id: mongoose.Types.ObjectId
  title: string
  scheduledTime: Date
  duration: number
  capacity: number
  status: 'scheduled' | 'open' | 'full' | 'in-progress' | 'completed' | 'cancelled'
  participants: mongoose.Types.ObjectId[]
  waitlist: Array<{
    user: mongoose.Types.ObjectId
    joinedAt: Date
  }>
  interestTags: string[]
  parentRoomId?: mongoose.Types.ObjectId
  overflowRoomId?: mongoose.Types.ObjectId
  isOverflowRoom: boolean
  captainId?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

export interface IRegistration {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  registeredAt: Date
  status: 'registered' | 'cancelled' | 'no-show' | 'attended'
  attendedAt?: Date
  remarks?: string
  reminderSent?: boolean
  noShowAlertSent?: boolean
}

export interface IInterestTag {
  _id: mongoose.Types.ObjectId
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface IChatMessage {
  _id: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  userName: string
  userPhoto?: string
  message: string
  timestamp: Date
  createdAt: Date
  updatedAt: Date
}

export interface ITask {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  taskText: string
  submittedAt: Date
  completedAt?: Date
  isCompleted: boolean
  carriedOver: boolean
  createdAt: Date
  updatedAt: Date
}

export interface ISessionCompletion {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  completed: boolean
  incompleteReason?: string
  attendedAt?: Date
  taskCompletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IAdminLog {
  _id: mongoose.Types.ObjectId
  adminId: string
  adminName: string
  action:
    | 'user_blocked'
    | 'user_unblocked'
    | 'user_banned'
    | 'user_unbanned'
    | 'user_suspended'
    | 'user_unsuspended'
    | 'room_created'
    | 'room_updated'
    | 'room_cancelled'
    | 'captain_assigned'
    | 'captain_removed'
    | 'settings_updated'
    | 'announcement_sent'
    | 'view_logs'
  targetUserId?: string
  targetRoomId?: string
  reason: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ICaptainAssignment {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  roomId: mongoose.Types.ObjectId
  status: 'invited' | 'accepted' | 'declined' | 'completed' | 'cancelled'
  invitedAt: Date
  respondedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IStreak {
  _id: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  currentStreak: number
  longestStreak: number
  lastSessionDate?: Date
  totalSessions: number
  createdAt: Date
  updatedAt: Date
}

export interface IBandwidthStats {
  _id: mongoose.Types.ObjectId
  date: Date
  roomId: mongoose.Types.ObjectId
  bytesRelayed: number
  bytesDirect: number
  transportCount: number
  participantMinutes: number
  estimatedCost: number
  relayVsDirectRatio: number
  createdAt: Date
  updatedAt: Date
}
