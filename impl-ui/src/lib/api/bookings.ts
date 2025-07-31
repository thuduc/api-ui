import { ApiResponse, Booking, Payment } from '@/types'
import { apiClient } from './client'

export interface CreateBookingData {
  trip_id: string
  passenger_name: string
  has_bicycle: boolean
  has_dog: boolean
}

export interface CreatePaymentData {
  amount: number
  currency: string
  source: any
}

export async function getBookings(page?: number, limit?: number): Promise<ApiResponse<Booking[]>> {
  return apiClient.get<Booking[]>('/api/bookings', { page, limit })
}

export async function getBooking(id: string): Promise<Booking> {
  const response = await apiClient.get<Booking>(`/api/bookings/${id}`)
  return response.data!
}

export async function createBooking(data: CreateBookingData): Promise<Booking> {
  const response = await apiClient.post<Booking>('/api/bookings', data)
  return response.data!
}

export async function cancelBooking(id: string): Promise<void> {
  await apiClient.delete(`/api/bookings/${id}`)
}

export async function createPayment(bookingId: string, data: CreatePaymentData): Promise<Payment> {
  const response = await apiClient.post<Payment>(`/api/bookings/${bookingId}/payment`, data)
  return response.data!
}