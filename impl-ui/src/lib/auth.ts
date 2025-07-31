import type { NextAuthOptions } from 'next-auth'

// Mock OAuth provider for development
const MockProvider = {
  id: 'mock',
  name: 'Mock Provider',
  type: 'oauth' as const,
  version: '2.0',
  authorization: {
    url: 'https://example.com/oauth/authorize',
    params: {
      scope: 'read write',
    },
  },
  token: 'https://example.com/oauth/token',
  userinfo: 'https://example.com/oauth/userinfo',
  profile(profile: any) {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
    }
  },
  clientId: process.env.MOCK_CLIENT_ID || 'mock-client-id',
  clientSecret: process.env.MOCK_CLIENT_SECRET || 'mock-client-secret',
}

export const authOptions: NextAuthOptions = {
  providers: [MockProvider],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}