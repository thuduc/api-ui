'use client'

import { Trip } from '@/types'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatTime, formatDuration, formatPrice } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { getStations } from '@/lib/api/stations'

interface TripCardProps {
  trip: Trip
  onBook: () => void
}

export function TripCard({ trip, onBook }: TripCardProps) {
  // Fetch station details
  const { data: stationsData } = useQuery({
    queryKey: ['stations-for-trip', trip.origin, trip.destination],
    queryFn: async () => {
      const stations = await getStations({ limit: 100 })
      return stations.data
    },
  })

  const originStation = stationsData?.find(s => s.id === trip.origin)
  const destinationStation = stationsData?.find(s => s.id === trip.destination)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold">{formatTime(trip.departure_time)}</p>
                <p className="text-gray-600">{originStation?.name || 'Loading...'}</p>
              </div>
              <div className="flex-1 text-center">
                <p className="text-sm text-gray-500">
                  {formatDuration(trip.departure_time, trip.arrival_time)}
                </p>
                <div className="border-t border-gray-300 my-2"></div>
                <p className="text-sm text-gray-600">{trip.operator}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatTime(trip.arrival_time)}</p>
                <p className="text-gray-600">{destinationStation?.name || 'Loading...'}</p>
              </div>
            </div>
          </div>
          <div className="text-right ml-8">
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(trip.price)}
            </p>
          </div>
        </div>

        <div className="flex gap-4 text-sm text-gray-600">
          {trip.bicycles_allowed && (
            <span className="flex items-center gap-1">
              🚲 Bicycles allowed
            </span>
          )}
          {trip.dogs_allowed && (
            <span className="flex items-center gap-1">
              🐕 Dogs allowed
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onBook} className="w-full">
          Book this trip
        </Button>
      </CardFooter>
    </Card>
  )
}