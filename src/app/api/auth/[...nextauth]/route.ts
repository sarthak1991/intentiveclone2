import NextAuth, { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { User } from '@/models/User'
import { connectDB } from '@/lib/db'
import { sendMagicLinkEmail } from '@/lib/email'
import { authConfig } from '@/config/auth.config'

// Extend NextAuth types to include our custom fields
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      isOnboarded: boolean
      role?: string
    } & DefaultSession['user']
  }

  interface User {
    id: string
    isOnboarded: boolean
    role?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    onboarded: boolean
    role?: string
  }
}

export const authOptions: NextAuthOptions = {
  ...authConfig,
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // Email/Password (fallback per D-04)
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        await connectDB()

        const user = await User.findOne({ email: credentials.email }).select('+password')
        if (!user || !user.password) {
          throw new Error("We couldn't find an account with that email. Want to sign up?")
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error("Hmm, that password doesn't match. Try again or reset it if you forgot.")
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.photoUrl,
          isOnboarded: user.isOnboarded,
          role: user.role
        }
      }
    }),

    // Google OAuth (optional per D-03)
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline'
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id
        token.onboarded = user.isOnboarded
        token.role = user.role
      }

      // Re-fetch onboarded status from DB when session.update() is called
      // (e.g. after completing onboarding wizard)
      if (trigger === 'update' && token.id) {
        await connectDB()
        const dbUser = await User.findById(token.id).select('isOnboarded role').lean()
        if (dbUser) {
          token.onboarded = (dbUser as any).isOnboarded
          token.role = (dbUser as any).role
        }
      }

      // Handle "Remember me" for 30-day sessions per D-06
      if (account?.provider === 'credentials' && (account as any).rememberMe) {
        token.exp = Date.now() + 30 * 24 * 60 * 60 * 1000
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isOnboarded = token.onboarded as boolean
        session.user.role = token.role as string
      }
      return session
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
