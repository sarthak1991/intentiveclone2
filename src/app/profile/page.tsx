import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { SignOutButton } from '@/components/auth/SignOutButton'

export default async function ProfilePage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  await connectDB()

  const user = await User.findById(session.user.id)

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

        <div className="space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <div className="text-gray-900">{user.name}</div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="text-gray-900">{user.email}</div>
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {user.role === 'admin' ? 'Admin' : 'User'}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timezone
            </label>
            <div className="text-gray-900">{user.timezone || 'Not set'}</div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interests
            </label>
            <div className="flex flex-wrap gap-2">
              {user.interests && user.interests.length > 0 ? (
                user.interests.map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                  >
                    {interest}
                  </span>
                ))
              ) : (
                <span className="text-gray-500">No interests selected</span>
              )}
            </div>
          </div>

          {/* Onboarding Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Onboarding
            </label>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {user.isOnboarded ? 'Completed' : 'Not completed'}
            </div>
          </div>

          {/* Account Created */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member Since
            </label>
            <div className="text-gray-900">
              {new Date(user.createdAt || Date.now()).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-3">
          <SignOutButton />

          {user.role === 'admin' && (
            <a
              href="/admin/rooms"
              className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center"
            >
              Admin Panel
            </a>
          )}

          <a
            href="/rooms"
            className="w-full sm:w-auto px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-center"
          >
            Back to Rooms
          </a>
        </div>
      </div>
    </div>
  )
}
