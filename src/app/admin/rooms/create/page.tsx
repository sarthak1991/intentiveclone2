import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { connectDB } from '@/lib/db'
import { InterestTag } from '@/models/InterestTag'
import { CreateRoomForm } from '@/components/admin/CreateRoomForm'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AdminCreateRoomPage() {
  // Check admin authorization
  const authCheck = await requireAdmin({} as any)

  if (!authCheck.authorized) {
    // Redirect to login if not authenticated, or show 403 if forbidden
    if (authCheck.error?.includes('Unauthorized')) {
      redirect('/login?redirect=/admin/rooms/create')
    }
    redirect('/403')
  }

  await connectDB()

  // Fetch active interest tags for the form
  const tags = await InterestTag.find({ isActive: true }).sort({ name: 1 })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <Link href="/admin/rooms" className="hover:underline">
            Admin
          </Link>
          <span>/</span>
          <Link href="/admin/rooms" className="hover:underline">
            Rooms
          </Link>
          <span>/</span>
          <span className="text-gray-900">Create</span>
        </div>
        <h1 className="text-3xl font-bold mb-2">Create New Room</h1>
        <p className="text-gray-600">
          Schedule a new focus room with custom time, capacity, and interest tags
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white p-8 rounded-lg border">
          <CreateRoomForm />
        </div>

        <div className="mt-4">
          <Link href="/admin/rooms">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
