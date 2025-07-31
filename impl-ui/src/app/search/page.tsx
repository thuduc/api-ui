'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format } from 'date-fns'
import { getStations } from '@/lib/api/stations'
import { getTrips } from '@/lib/api/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TripCard } from '@/components/trip-card'
import { StationSelect } from '@/components/station-select'

const searchSchema = z.object({
  origin: z.string().uuid('Please select a valid origin station'),
  destination: z.string().uuid('Please select a valid destination station'),
  date: z.string().min(1, 'Please select a date'),
  bicycles: z.boolean().default(false),
  dogs: z.boolean().default(false),
})

type SearchFormData = z.infer<typeof searchSchema>

export default function SearchPage() {
  const router = useRouter()
  const [searchParams, setSearchParams] = useState<SearchFormData | null>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      bicycles: false,
      dogs: false,
    },
  })

  const { data: tripsData, isLoading: isLoadingTrips } = useQuery({
    queryKey: ['trips', searchParams],
    queryFn: () => searchParams ? getTrips({
      ...searchParams,
      date: new Date(searchParams.date).toISOString(),
    }) : null,
    enabled: !!searchParams,
  })

  const onSubmit = (data: SearchFormData) => {
    setSearchParams(data)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Search Trips</h1>
        <p className="text-gray-600">Find the perfect train connection for your journey</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Trip Details</CardTitle>
          <CardDescription>Enter your travel information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origin">Origin Station</Label>
                <StationSelect
                  value={watch('origin')}
                  onChange={(value) => setValue('origin', value)}
                  placeholder="Select origin"
                />
                {errors.origin && (
                  <p className="text-red-500 text-sm mt-1">{errors.origin.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="destination">Destination Station</Label>
                <StationSelect
                  value={watch('destination')}
                  onChange={(value) => setValue('destination', value)}
                  placeholder="Select destination"
                />
                {errors.destination && (
                  <p className="text-red-500 text-sm mt-1">{errors.destination.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="date">Travel Date</Label>
              <Input
                id="date"
                type="date"
                {...register('date')}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
              )}
            </div>

            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <Checkbox {...register('bicycles')} />
                <span className="text-sm">Bicycles allowed</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox {...register('dogs')} />
                <span className="text-sm">Dogs allowed</span>
              </label>
            </div>

            <Button type="submit" className="w-full">
              Search Trips
            </Button>
          </form>
        </CardContent>
      </Card>

      {searchParams && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Available Trips</h2>
          {isLoadingTrips ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Searching for trips...</p>
            </div>
          ) : tripsData?.data && tripsData.data.length > 0 ? (
            <div className="space-y-4">
              {tripsData.data.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onBook={() => router.push(`/booking/new?tripId=${trip.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No trips found for your search criteria</p>
              <p className="text-sm text-gray-400 mt-2">Try adjusting your filters</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}