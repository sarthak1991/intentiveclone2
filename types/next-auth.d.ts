import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      image?: string | null
      isOnboarded: boolean
    }
  }

  interface User {
    id: string
    isOnboarded: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    onboarded: boolean
  }
}
