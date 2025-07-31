import { ApiResponse, Trip } from '@/types'
import { apiClient } from './client'

export interface TripFilters {
  origin: string
  destination: string
  date: string
  page?: number
  limit?: number
  bicycles?: boolean
  dogs?: boolean
}

export async function getTrips(filters: TripFilters): Promise<ApiResponse<Trip[]>> {
  return apiClient.get<Trip[]>('/api/trips', filters)
}

export async function getTrip(tripId: string): Promise<Trip> {
  const response = await apiClient.get<Trip>(`/api/trips/${tripId}`)
  return response.data!
}