import { ApiClient } from './client'
import { Payment } from '@/types'

const client = new ApiClient()

export interface ProcessPaymentData {
  card_number: string
  expiry_month: number
  expiry_year: number
  cvv: string
  cardholder_name: string
}

export async function processPayment(
  bookingId: string,
  paymentData: ProcessPaymentData
): Promise<Payment> {
  const response = await client.post<Payment>(
    `/api/bookings/${bookingId}/payment`,
    paymentData
  )
  return response.data!
}