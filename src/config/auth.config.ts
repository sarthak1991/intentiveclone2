export const authConfig = {
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
    verifyRequest: '/login/verify',
    newUser: '/onboarding/step1'
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days default
  },
  jwt: {
    maxAge: 15 * 60, // 15 minutes for access token
  }
}
