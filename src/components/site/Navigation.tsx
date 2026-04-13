'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { StreakBadge } from '@/components/profile/StreakBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User, LogOut, Settings, LayoutDashboard, Calendar, CreditCard, Users, Activity, Server, PlusCircle } from 'lucide-react'

export function Navigation() {
  const { data: session, status } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (session?.user?.email) {
      fetch('/api/auth/check-admin')
        .then(res => res.json())
        .then(data => setIsAdmin(data.isAdmin))
        .catch(() => setIsAdmin(false))
    }
  }, [session])

  const handleSignOut = async () => {
    await signOut({ redirect: false })
    window.location.href = '/login'
  }

  if (status === 'loading') {
    return null
  }

  if (!session) {
    return (
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">F</span>
            </div>
            FocusFlow
          </Link>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">F</span>
          </div>
          FocusFlow
        </Link>

        <div className="flex items-center gap-6">
          {/* Main Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/rooms"
              className="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Rooms
              </div>
            </Link>
            <Link
              href="/pricing"
              className="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Pricing
              </div>
            </Link>
          </div>

          {/* Admin Dropdown */}
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-md font-medium transition-colors flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Admin Panel</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/rooms" className="cursor-pointer">
                    <Calendar className="w-4 h-4" />
                    Manage Rooms
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/rooms/create" className="cursor-pointer">
                    <PlusCircle className="w-4 h-4" />
                    Create Room
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/users" className="cursor-pointer">
                    <Users className="w-4 h-4" />
                    Manage Users
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/bandwidth" className="cursor-pointer">
                    <Activity className="w-4 h-4" />
                    Bandwidth Stats
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/debug" className="cursor-pointer">
                    <Server className="w-4 h-4" />
                    Debug
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Streak Badge */}
          <div className="hidden sm:block">
            <StreakBadge userId={session.user?.id} />
          </div>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className="hidden sm:block font-medium text-gray-700">
                  {session.user?.name || 'Profile'}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t py-2 px-4 flex justify-around">
        <Link
          href="/rooms"
          className="flex flex-col items-center text-xs text-gray-600 hover:text-blue-600"
        >
          <Calendar className="w-5 h-5 mb-1" />
          Rooms
        </Link>
        <Link
          href="/pricing"
          className="flex flex-col items-center text-xs text-gray-600 hover:text-blue-600"
        >
          <CreditCard className="w-5 h-5 mb-1" />
          Pricing
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="flex flex-col items-center text-xs text-gray-600 hover:text-blue-600"
          >
            <LayoutDashboard className="w-5 h-5 mb-1" />
            Admin
          </Link>
        )}
        <Link
          href="/profile"
          className="flex flex-col items-center text-xs text-gray-600 hover:text-blue-600"
        >
          <User className="w-5 h-5 mb-1" />
          Profile
        </Link>
      </div>
    </nav>
  )
}
