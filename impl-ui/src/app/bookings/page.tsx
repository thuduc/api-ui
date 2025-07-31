'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getBookings, cancelBooking } from '@/lib/api/bookings'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime, formatPrice } from '@/lib/utils'
import { Booking } from '@/types'

export default function BookingsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
    }
  }, [status, router])

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => getBookings(),
    enabled: status === 'authenticated',
  })

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
    },
  })

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading bookings</p>
      </div>
    )
  }

  const bookings = data?.data || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage your train bookings</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">You don't have any bookings yet</p>
            <Button onClick={() => router.push('/search')}>
              Search for trips
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking: Booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Booking #{booking.id.slice(-8)}
                    </CardTitle>
                    <CardDescription>
                      {formatDateTime(booking.created_at)}
                    </CardDescription>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Passenger:</span>
                    <span className="font-medium">{booking.passenger_name}</span>
                  </div>
                  {booking.has_bicycle && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bicycle:</span>
                      <span>Yes</span>
                    </div>
                  )}
                  {booking.has_dog && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dog:</span>
                      <span>Yes</span>
                    </div>
                  )}
                  {booking.expires_at && booking.status === 'pending' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Expires at:</span>
                      <span className="text-amber-600">
                        {formatDateTime(booking.expires_at)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                {booking.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => router.push(`/booking/${booking.id}/payment`)}
                      size="sm"
                    >
                      Complete Payment
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to cancel this booking?')) {
                          cancelMutation.mutate(booking.id)
                        }
                      }}
                      disabled={cancelMutation.isPending}
                    >
                      Cancel
                    </Button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <div className="text-sm text-green-600">
                    ✓ Payment confirmed
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {data?.links && (data.links.prev || data.links.next) && (
        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => {/* Handle pagination */}}
            disabled={!data.links.prev}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={() => {/* Handle pagination */}}
            disabled={!data.links.next}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}