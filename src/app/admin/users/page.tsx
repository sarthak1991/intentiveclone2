import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { Registration } from '@/models/Registration'
import { Streak } from '@/models/Streak'
import { UserTable } from '@/components/admin/UserTable'

// Define a simpler user type for client component
interface SimpleUser {
  _id: string
  name: string
  email: string
  status: 'active' | 'suspended' | 'banned'
  createdAt: string
  updatedAt: string
  sessionsAttended: number
  noShowCount: number
  totalRegistrations: number
  noShowRate: number
  currentStreak: number
}

export default async function AdminUsersPage() {
  // Check admin authorization
  const authCheck = await requireAdmin({} as any)

  if (!authCheck.authorized) {
    // Redirect to login if not authenticated, or show 403 if forbidden
    if (authCheck.error?.includes('Unauthorized')) {
      redirect('/login?redirect=/admin/users')
    }
    redirect('/403')
  }

  await connectDB()

  // Fetch all users with their statistics
  const users = await User.find({})
    .select('-password')
    .sort({ createdAt: -1 })
    .lean()

  // Get statistics for each user
  const usersWithStats: SimpleUser[] = await Promise.all(
    users.map(async (user) => {
      // Count registrations and calculate no-show rate
      const registrations = await Registration.find({ userId: user._id }).lean()

      const sessionsAttended = registrations.filter((r: any) => r.status === 'attended').length
      const noShowCount = registrations.filter((r: any) => r.status === 'no-show').length
      const totalRegistrations = registrations.length
      const noShowRate = totalRegistrations > 0
        ? Math.round((noShowCount / totalRegistrations) * 100)
        : 0

      // Get current streak
      const streak = await Streak.findOne({ userId: user._id }).lean()
      const currentStreak = streak?.currentStreak || 0

      return {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        sessionsAttended,
        noShowCount,
        totalRegistrations,
        noShowRate,
        currentStreak,
      }
    })
  )

  // Calculate statistics
  const totalUsers = usersWithStats.length
  const activeUsers = usersWithStats.filter((u) => u.status === 'active').length
  const suspendedUsers = usersWithStats.filter((u) => u.status === 'suspended').length
  const bannedUsers = usersWithStats.filter((u) => u.status === 'banned').length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600">
          Manage user accounts, view statistics, and handle moderation
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-3xl font-bold">{totalUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-green-200">
          <div className="text-sm text-gray-600 mb-1">Active Users</div>
          <div className="text-3xl font-bold text-green-600">{activeUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-yellow-200">
          <div className="text-sm text-gray-600 mb-1">Suspended</div>
          <div className="text-3xl font-bold text-yellow-600">{suspendedUsers}</div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-red-200">
          <div className="text-sm text-gray-600 mb-1">Banned</div>
          <div className="text-3xl font-bold text-red-600">{bannedUsers}</div>
        </div>
      </div>

      {/* User Table */}
      <UserTable users={usersWithStats} />
    </div>
  )
}
