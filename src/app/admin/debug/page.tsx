import { auth } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'

export default async function AdminDebugPage() {
  const session = await auth()

  if (!session?.user) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold">Not Authenticated</h1>
        <p>Please <a href="/login" className="text-blue-600">login</a> first.</p>
      </div>
    )
  }

  await connectDB()

  const dbUser = await User.findById(session.user.id)

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Debug</h1>

      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Session Data</h2>
          <pre>{JSON.stringify(session, null, 2)}</pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Session.user.id</h2>
          <p>{session.user.id}</p>
          <p className="text-sm text-gray-600">Type: {typeof session.user.id}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold">Database User</h2>
          {dbUser ? (
            <>
              <p>Name: {dbUser.name}</p>
              <p>Email: {dbUser.email}</p>
              <p>Role: {dbUser.role}</p>
              <p>DB ID: {dbUser._id.toString()}</p>
            </>
          ) : (
            <p className="text-red-600">User not found in database!</p>
          )}
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="font-bold">Admin Check</h2>
          <p>
            Is Admin: {dbUser?.role === 'admin' ? '✅ Yes' : '❌ No'}
          </p>
          <p>
            IDs Match: {dbUser && session.user.id === dbUser._id.toString() ? '✅ Yes' : '❌ No'}
          </p>
        </div>

        <div className="mt-4">
          <a href="/admin/rooms" className="bg-blue-600 text-white px-4 py-2 rounded">
            Go to Admin Panel
          </a>
        </div>
      </div>
    </div>
  )
}
