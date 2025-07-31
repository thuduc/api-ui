import { ApiResponse, Station } from '@/types'
import { apiClient } from './client'

export interface StationFilters {
  page?: number
  limit?: number
  coordinates?: string
  search?: string
  country?: string
}

export async function getStations(filters?: StationFilters): Promise<ApiResponse<Station[]>> {
  return apiClient.get<Station[]>('/api/stations', filters)
}