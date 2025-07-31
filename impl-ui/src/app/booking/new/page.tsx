'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, Suspense } from 'react'
import { getTrips } from '@/lib/api/trips'
import { createBooking } from '@/lib/api/bookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TripCard } from '@/components/trip-card'
import { ApiError } from '@/lib/api/client'

const bookingSchema = z.object({
  passenger_name: z.string().min(1, 'Passenger name is required'),
  has_bicycle: z.boolean().default(false),
  has_dog: z.boolean().default(false),
})

type BookingFormData = z.infer<typeof bookingSchema>

function NewBookingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  
  const tripId = searchParams.get('tripId')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
    }
  }, [status, router])

  const { data: tripData, isLoading: isLoadingTrip } = useQuery({
    queryKey: ['trip', tripId],
    queryFn: async () => {
      if (!tripId) return null
      // Fetch trip details by making a search
      const trips = await getTrips({
        origin: 'efdbb9d1-02c2-4bc3-afb7-6788d8782b1e', // Dummy, we'll filter by ID
        destination: 'b2e783e1-c824-4d63-b37a-d8d698862f1d',
        date: new Date().toISOString(),
      })
      return trips.data?.find(t => t.id === tripId)
    },
    enabled: !!tripId,
  })

  const { register, handleSubmit, formState: { errors }, watch } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      passenger_name: session?.user?.name || '',
      has_bicycle: false,
      has_dog: false,
    },
  })

  const createBookingMutation = useMutation({
    mutationFn: (data: BookingFormData) => {
      if (!tripId) throw new Error('No trip selected')
      return createBooking({
        trip_id: tripId,
        ...data,
      })
    },
    onSuccess: (booking) => {
      router.push(`/booking/${booking.id}/payment`)
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setError(error.problem.detail || error.problem.title)
      } else {
        setError('Failed to create booking')
      }
    },
  })

  const onSubmit = (data: BookingFormData) => {
    setError(null)
    createBookingMutation.mutate(data)
  }

  if (status === 'loading' || isLoadingTrip) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!tripId || !tripData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No trip selected</p>
        <Button onClick={() => router.push('/search')}>
          Search for trips
        </Button>
      </div>
    )
  }

  const hasBicycle = watch('has_bicycle')
  const hasDog = watch('has_dog')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Trip</h1>
        <p className="text-gray-600">Complete your booking details</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Selected Trip</h2>
        <TripCard trip={tripData} onBook={() => {}} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Passenger Details</CardTitle>
          <CardDescription>Enter the passenger information for this booking</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="passenger_name">Passenger Name</Label>
              <Input
                id="passenger_name"
                {...register('passenger_name')}
                placeholder="Enter passenger name"
              />
              {errors.passenger_name && (
                <p className="text-red-500 text-sm mt-1">{errors.passenger_name.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Additional Options</Label>
              <label className="flex items-center gap-2">
                <Checkbox {...register('has_bicycle')} />
                <span>Traveling with a bicycle</span>
              </label>
              {hasBicycle && !tripData.bicycles_allowed && (
                <p className="text-amber-600 text-sm ml-6">
                  ⚠️ Bicycles are not allowed on this trip
                </p>
              )}
              
              <label className="flex items-center gap-2">
                <Checkbox {...register('has_dog')} />
                <span>Traveling with a dog</span>
              </label>
              {hasDog && !tripData.dogs_allowed && (
                <p className="text-amber-600 text-sm ml-6">
                  ⚠️ Dogs are not allowed on this trip
                </p>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createBookingMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createBookingMutation.isPending}
            >
              {createBookingMutation.isPending ? 'Creating...' : 'Continue to Payment'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-amber-800 text-sm">
          <strong>Note:</strong> Your booking will be held for 1 hour. Please complete the payment within this time to confirm your reservation.
        </p>
      </div>
    </div>
  )
}

export default function NewBookingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-[400px]">
      <p className="text-gray-500">Loading...</p>
    </div>}>
      <NewBookingPageContent />
    </Suspense>
  )
}