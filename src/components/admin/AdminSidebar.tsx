'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Activity,
  DoorOpen,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  className?: string
}

const navigationItems = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    id: 'attendance',
    label: 'Attendance',
    href: '/admin/attendance',
    icon: Users
  },
  {
    id: 'users',
    label: 'Users',
    href: '/admin/users',
    icon: UserCog
  },
  {
    id: 'bandwidth',
    label: 'Bandwidth',
    href: '/admin/bandwidth',
    icon: Activity
  },
  {
    id: 'rooms',
    label: 'Rooms',
    href: '/admin/rooms',
    icon: DoorOpen
  }
]

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await signOut({ redirect: false })
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col',
      className
    )}>
      {/* Logo / Brand */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold">FocusFlow Admin</h1>
        <p className="text-sm text-slate-400 mt-1">Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sign Out */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleSignOut}
          disabled={loading}
          className={cn(
            'flex items-center gap-3 px-4 py-3 w-full rounded-md transition-colors',
            'text-slate-300 hover:bg-red-600 hover:text-white disabled:opacity-50'
          )}
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">{loading ? 'Signing out...' : 'Sign Out'}</span>
        </button>
      </div>
    </aside>
  )
}
