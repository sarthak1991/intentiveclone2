import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check admin authorization
  const authCheck = await requireAdmin({} as any)

  if (!authCheck.authorized) {
    // Redirect to login if not authenticated, or show 403 if forbidden
    if (authCheck.error?.includes('Unauthorized')) {
      redirect('/login?redirect=/admin')
    }
    redirect('/403')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
