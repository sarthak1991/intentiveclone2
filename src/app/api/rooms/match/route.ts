import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectDB } from '@/lib/db'
import { Room } from '@/models/Room'
import { User } from '@/models/User'
import { Registration } from '@/models/Registration'
import { InterestTag } from '@/models/InterestTag'

/**
 * GET /api/rooms/match
 * Returns rooms matched based on user's interests.
 * Prioritizes rooms with higher match scores.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await getServerSession()

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Connect to database
    await connectDB()

    const userId = session.user.id

    // 3. Get user's interests
    const user = await User.findById(userId).select('interests')

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // 4. If no interests, return standard rooms (fallback)
    if (!user.interests || user.interests.length === 0) {
      const standardRooms = await Room.find({
        scheduledTime: { $gt: new Date() },
        status: { $in: ['scheduled', 'open'] },
      })
        .sort({ scheduledTime: 1 })
        .limit(5)
        .lean()

      return NextResponse.json({
        success: true,
        matched: false,
        rooms: standardRooms.map((room) => ({
          id: room._id.toString(),
          title: room.title,
          scheduledTime: room.scheduledTime.toISOString(),
          capacity: room.capacity,
          interestTags: room.interestTags || [],
          matchScore: 0,
        })),
      })
    }

    const userInterests = user.interests

    // 5. Find scheduled rooms
    const now = new Date()
    const scheduledRooms = await Room.find({
      scheduledTime: { $gt: now },
      status: { $in: ['scheduled', 'open'] },
    }).lean()

    // 6. Calculate match score for each room
    const roomsWithScores = await Promise.all(
      scheduledRooms.map(async (room) => {
        // Count registered users with matching interests
        const registrations = await Registration.find({
          roomId: room._id,
          status: 'registered',
        }).lean()

        // Get interests of all registered users
        const registeredUserIds = registrations.map((r) => r.userId)
        const registeredUsers = await User.find({
          _id: { $in: registeredUserIds },
        }).select('interests')

        // Calculate interest overlap with current user
        const roomInterests = room.interestTags || []
        const overlappingInterests = userInterests.filter((interest: string) =>
          roomInterests.includes(interest)
        )

        // Count users with matching interests
        let usersWithMatchingInterests = 0
        for (const regUser of registeredUsers) {
          const userIntersect = regUser.interests.filter((interest: string) =>
            userInterests.includes(interest)
          )
          if (userIntersect.length > 0) {
            usersWithMatchingInterests++
          }
        }

        // Calculate match score
        // Base score from interest overlap + bonus for participant count
        const interestOverlap = overlappingInterests.length
        const participantBonus = registrations.length / 10 // Small bonus for participants
        const matchScore = interestOverlap * 10 + participantBonus

        // Get matched interest tag names
        const matchedInterests = await InterestTag.find({
          name: { $in: overlappingInterests },
        }).select('name')

        return {
          id: room._id.toString(),
          title: room.title,
          scheduledTime: room.scheduledTime.toISOString(),
          capacity: room.capacity,
          participantCount: registrations.length,
          spotsAvailable: room.capacity - registrations.length,
          interestTags: room.interestTags || [],
          matchedInterests: matchedInterests.map((tag) => tag.name),
          matchScore,
        }
      })
    )

    // 7. Filter: Include if match score > 0 OR has 3+ users with matching interests
    const MIN_THRESHOLD = 3
    const filteredRooms = roomsWithScores.filter(
      (room) => room.matchScore > 0 || room.usersWithMatchingInterests >= MIN_THRESHOLD
    )

    // 8. Sort by match score descending, then by scheduledTime ascending
    const sortedRooms = filteredRooms.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore
      }
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    })

    // 9. Limit to 5 results
    const finalRooms = sortedRooms.slice(0, 5)

    // 10. Return response
    return NextResponse.json(
      {
        success: true,
        matched: finalRooms.length > 0,
        rooms: finalRooms,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error matching rooms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to match rooms' },
      { status: 500 }
    )
  }
}
