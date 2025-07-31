import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Allow all users to access public pages
      const publicPaths = ['/', '/stations', '/search', '/api/auth']
      const isPublicPath = publicPaths.some(path => 
        req.nextUrl.pathname.startsWith(path)
      )
      
      if (isPublicPath) return true
      
      // Require authentication for other pages
      return !!token
    },
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}