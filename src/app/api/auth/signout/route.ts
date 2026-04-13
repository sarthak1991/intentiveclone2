import { NextRequest, NextResponse } from 'next/server'
import { signOut as nextAuthSignOut } from 'next-auth/react'

// Server-side signOut action
export async function POST() {
  // Return a response that will trigger client-side signOut
  return NextResponse.json({ success: true, redirect: '/login' })
}

// For server actions, we use NextAuth's handler
import NextAuth from 'next-auth'
import { authOptions } from '../[...nextauth]/route'

async function signOut() {
  // This is a placeholder - the actual signOut happens through NextAuth
  // The client-side signOut from next-auth/react handles clearing cookies
  return { success: true }
}

export { signOut }
