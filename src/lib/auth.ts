import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function auth() {
  return await getServerSession(authOptions)
}

export async function getSession() {
  const session = await auth()
  return session
}

export async function signIn(provider?: string, options?: any) {
  // This will be handled by NextAuth.js signIn from client
  return { success: true }
}

export async function signOut() {
  // This will be handled by NextAuth.js signOut from client
  return { success: true }
}
