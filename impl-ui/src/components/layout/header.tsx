'use client'

import Link from 'next/link'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Train Travel
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              <Link href="/stations" className="text-gray-600 hover:text-gray-900">
                Stations
              </Link>
              <Link href="/search" className="text-gray-600 hover:text-gray-900">
                Search Trips
              </Link>
              {session && (
                <Link href="/bookings" className="text-gray-600 hover:text-gray-900">
                  My Bookings
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {status === 'loading' ? (
              <div className="text-gray-400">Loading...</div>
            ) : session ? (
              <>
                <span className="text-sm text-gray-600">{session.user?.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <Button
                onClick={() => signIn()}
                size="sm"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}