import { Room, IRoom } from '@/models/Room'
import { Registration, IRegistration } from '@/models/Registration'
import { User, IUser } from '@/models/User'
import { connectDB } from '@/lib/db'
import { formatDistanceToNow, differenceInMinutes, addMinutes, isAfter, isBefore } from 'date-fns'
import { getUserTimezone, formatRoomTime, getTimeUntilRoom } from '@/lib/timezone'

/**
 * Registration status types
 */
export type RegistrationStatusType = 'closed' | 'opening-soon' | 'open' | 'registered' | 'full'

/**
 * Registration status result
 */
export interface RegistrationStatus {
  status: RegistrationStatusType
  canRegister: boolean
  message: string
}

/**
 * Room with registration status for user
 */
export interface RoomWithStatus extends IRoom {
  displayTime?: string
  registrationStatus?: RegistrationStatus
}

/**
 * Get today's rooms (8 rooms from 9am-4pm)
 * @param timezone - Optional timezone for filtering (defaults to server timezone)
 * @returns Array of today's rooms
 */
export async function getTodaysRooms(timezone?: string): Promise<IRoom[]> {
  await connectDB()

  const now = new Date()
  const startOfDay = new Date(now)
  startOfDay.setHours(0, 0, 0, 0)

  const endOfDay = new Date(now)
  endOfDay.setHours(23, 59, 59, 999)

  const rooms = await Room.find({
    scheduledTime: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    status: { $ne: 'cancelled' }
  }).sort({ scheduledTime: 1 })

  return rooms
}

/**
 * Get registration status for a room and user
 * @param room - The room object
 * @param user - Optional user object
 * @returns Registration status with message
 *
 * TEMPORARY: All rooms are always open for registration (no time/capacity restrictions)
 */
export function getRegistrationStatus(room: IRoom, user?: IUser | null): RegistrationStatus {
  // User is already registered
  if (user && room.participants.some(p => p.toString() === user._id.toString())) {
    return {
      status: 'registered',
      canRegister: false,
      message: "You're registered"
    }
  }

  // Always open for registration (temporary)
  return {
    status: 'open',
    canRegister: true,
    message: 'Register now'
  }
}

/**
 * Check if registration window is open for a room
 * @param room - The room object
 * @returns True if registration is open (30 min before session)
 */
export function isRegistrationOpen(room: IRoom): boolean {
  const status = getRegistrationStatus(room)
  return status.canRegister
}

/**
 * Register a user for a room (atomic operation)
 * @param roomId - Room ID
 * @param userId - User ID
 * @returns Updated room object
 *
 * TEMPORARY: No capacity or time restrictions
 */
export async function registerForRoom(roomId: string, userId: string): Promise<IRoom> {
  await connectDB()

  // Check if room exists
  const room = await Room.findById(roomId)
  if (!room) {
    throw new Error('Room not found')
  }

  // Check if already registered
  if (room.participants.some(p => p.toString() === userId)) {
    throw new Error('Already registered')
  }

  // Add participant (no capacity check temporarily)
  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    {
      $push: { participants: userId }
    },
    {
      new: true,
      runValidators: true
    }
  )

  if (!updatedRoom) {
    throw new Error('Failed to register')
  }

  // Create registration record
  await Registration.create({
    userId,
    roomId,
    registeredAt: new Date(),
    status: 'registered'
  })

  return updatedRoom
}

/**
 * Cancel a user's registration for a room
 * @param roomId - Room ID
 * @param userId - User ID
 * @returns Updated room object
 * @throws Error if user is not registered
 */
export async function cancelRegistration(roomId: string, userId: string): Promise<IRoom> {
  await connectDB()

  // Check if registration exists
  const registration = await Registration.findOne({
    userId,
    roomId,
    status: 'registered'
  })

  if (!registration) {
    throw new Error('Registration not found')
  }

  // Remove user from room participants
  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    {
      $pull: { participants: userId }
    },
    {
      new: true,
      runValidators: true
    }
  )

  if (!updatedRoom) {
    throw new Error('Room not found')
  }

  // Update registration status
  registration.status = 'cancelled'
  await registration.save()

  // Update room status if no longer full
  if (updatedRoom.status === 'full' && updatedRoom.participants.length < updatedRoom.capacity) {
    updatedRoom.status = 'open'
    await updatedRoom.save()
  }

  return updatedRoom
}

/**
 * Add user to room waitlist
 * @param roomId - Room ID
 * @param userId - User ID
 * @returns Updated room object
 */
export async function joinWaitlist(roomId: string, userId: string): Promise<IRoom> {
  await connectDB()

  // Check if user is already on waitlist
  const room = await Room.findById(roomId)
  if (!room) {
    throw new Error('Room not found')
  }

  const alreadyOnWaitlist = room.waitlist.some(w => w.user.toString() === userId.toString())
  if (alreadyOnWaitlist) {
    throw new Error('Already on waitlist')
  }

  // Add to waitlist
  const updatedRoom = await Room.findByIdAndUpdate(
    roomId,
    {
      $push: {
        waitlist: {
          user: userId,
          joinedAt: new Date()
        }
      }
    },
    {
      new: true,
      runValidators: true
    }
  )

  if (!updatedRoom) {
    throw new Error('Failed to join waitlist')
  }

  return updatedRoom
}

/**
 * Get rooms with user-specific data (display time, registration status)
 * @param rooms - Array of rooms
 * @param user - User object
 * @returns Array of rooms with user-specific data
 */
export async function enrichRoomsWithUserData(rooms: IRoom[], user: IUser): Promise<RoomWithStatus[]> {
  const userTimezone = getUserTimezone(user)

  return rooms.map(room => ({
    ...room.toObject(),
    displayTime: formatRoomTime(room.scheduledTime, userTimezone),
    registrationStatus: getRegistrationStatus(room, user)
  }))
}

/**
 * Update room status based on current time
 * Should be called by a cron job periodically
 */
export async function updateRoomStatuses(): Promise<void> {
  await connectDB()

  const now = new Date()

  // Find rooms that should be in progress
  const roomsToStart = await Room.find({
    status: { $in: ['scheduled', 'open'] },
    scheduledTime: { $lte: now }
  })

  for (const room of roomsToStart) {
    const endTime = addMinutes(room.scheduledTime, room.duration)
    if (isBefore(now, endTime)) {
      room.status = 'in-progress'
      await room.save()
    }
  }

  // Find rooms that should be completed
  const roomsToComplete = await Room.find({
    status: 'in-progress'
  })

  for (const room of roomsToComplete) {
    const endTime = addMinutes(room.scheduledTime, room.duration)
    if (isAfter(now, endTime)) {
      room.status = 'completed'
      await room.save()
    }
  }
}

/**
 * Record a user as no-show and reassign their slot to waitlist
 * @param roomId - Room ID
 * @param userId - User ID
 * @param remarks - Optional remarks
 * @returns Updated room and promoted user (if any)
 */
export async function recordNoShow(
  roomId: string,
  userId: string,
  remarks?: string
): Promise<{ room: IRoom; promotedUser?: IUser }> {
  await connectDB()

  // Find and update registration
  const registration = await Registration.findOne({
    userId,
    roomId,
    status: 'registered'
  })

  if (!registration) {
    throw new Error('Registration not found')
  }

  registration.status = 'no-show'
  registration.remarks = remarks
  await registration.save()

  // Remove from room participants
  const room = await Room.findById(roomId)
  if (!room) {
    throw new Error('Room not found')
  }

  room.participants = room.participants.filter(p => p.toString() !== userId.toString())
  await room.save()

  let promotedUser: IUser | undefined

  // Promote first user from waitlist if exists
  if (room.waitlist.length > 0) {
    const firstWaiting = room.waitlist[0]
    const waitingUser = await User.findById(firstWaiting.user)

    if (waitingUser) {
      // Add to participants
      room.participants.push(waitingUser._id)
      // Remove from waitlist
      room.waitlist.shift()
      await room.save()

      // Create registration for promoted user
      await Registration.create({
        userId: waitingUser._id,
        roomId,
        registeredAt: new Date(),
        status: 'registered'
      })

      promotedUser = waitingUser
    }
  }

  // Update room status if no longer full
  if (room.status === 'full' && room.participants.length < room.capacity) {
    room.status = 'open'
    await room.save()
  }

  return { room, promotedUser }
}

/**
 * Get room participants with populated user data
 * @param roomId - Room ID
 * @returns Array of user objects
 */
export async function getRoomParticipants(roomId: string): Promise<IUser[]> {
  await connectDB()

  const room = await Room.findById(roomId).populate('participants')

  if (!room) {
    throw new Error('Room not found')
  }

  return room.participants as unknown as IUser[]
}

/**
 * Update room status
 * @param roomId - Room ID
 * @param status - New status
 * @returns Updated room object
 * @throws Error if invalid status
 */
export async function updateRoomStatus(roomId: string, status: IRoom['status']): Promise<IRoom> {
  await connectDB()

  const validStatuses: IRoom['status'][] = ['scheduled', 'open', 'full', 'in-progress', 'completed', 'cancelled']

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`)
  }

  const room = await Room.findByIdAndUpdate(
    roomId,
    { status },
    {
      new: true,
      runValidators: true
    }
  )

  if (!room) {
    throw new Error('Room not found')
  }

  return room
}
