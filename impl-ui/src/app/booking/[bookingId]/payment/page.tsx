'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect } from 'react'
import { getBooking, createPayment } from '@/lib/api/bookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ApiError } from '@/lib/api/client'
import { formatPrice, formatDateTime } from '@/lib/utils'

const cardPaymentSchema = z.object({
  payment_method: z.literal('card'),
  card_name: z.string().min(1, 'Cardholder name is required'),
  card_number: z.string().regex(/^\d{13,19}$/, 'Invalid card number'),
  card_expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY'),
  card_cvc: z.string().regex(/^\d{3,4}$/, 'Invalid CVC'),
  address_country: z.string().length(2, 'Country code must be 2 letters'),
  address_post_code: z.string().min(1, 'Postal code is required'),
})

type CardPaymentFormData = z.infer<typeof cardPaymentSchema>

export default function PaymentPage({ params }: { params: { bookingId: string } }) {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank'>('card')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
    }
  }, [status, router])

  const { data: booking, isLoading: isLoadingBooking } = useQuery({
    queryKey: ['booking', params.bookingId],
    queryFn: () => getBooking(params.bookingId),
    enabled: !!params.bookingId,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<CardPaymentFormData>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: {
      payment_method: 'card',
      address_country: 'GB',
    },
  })

  const paymentMutation = useMutation({
    mutationFn: async (data: CardPaymentFormData) => {
      if (!booking) throw new Error('No booking found')
      
      const [expMonth, expYear] = data.card_expiry.split('/')
      
      return createPayment(params.bookingId, {
        amount: 50, // This should come from the trip price
        currency: 'gbp',
        source: {
          object: 'card',
          name: data.card_name,
          number: data.card_number,
          cvc: data.card_cvc,
          exp_month: parseInt(expMonth),
          exp_year: 2000 + parseInt(expYear),
          address_country: data.address_country,
          address_post_code: data.address_post_code,
        },
      })
    },
    onSuccess: () => {
      router.push('/bookings')
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setError(error.problem.detail || error.problem.title)
      } else {
        setError('Payment failed. Please try again.')
      }
    },
  })

  const onSubmit = (data: CardPaymentFormData) => {
    setError(null)
    paymentMutation.mutate(data)
  }

  if (status === 'loading' || isLoadingBooking) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">Booking not found</p>
        <Button onClick={() => router.push('/bookings')}>
          View my bookings
        </Button>
      </div>
    )
  }

  if (booking.status !== 'pending') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">This booking has already been processed</p>
        <Button onClick={() => router.push('/bookings')}>
          View my bookings
        </Button>
      </div>
    )
  }

  const bookingExpiry = booking.expires_at ? new Date(booking.expires_at) : null
  const isExpired = bookingExpiry && bookingExpiry < new Date()

  if (isExpired) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">This booking has expired</p>
        <Button onClick={() => router.push('/search')}>
          Search for new trips
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Payment</h1>
        <p className="text-gray-600">Secure payment for your booking</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Booking Summary</CardTitle>
          <CardDescription>Booking ID: {booking.id}</CardDescription>
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
            {bookingExpiry && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires at:</span>
                <span className="text-amber-600">{formatDateTime(booking.expires_at!)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Choose your payment method</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 p-4 border-2 rounded-lg ${
                  paymentMethod === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <p className="font-medium">Credit/Debit Card</p>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('bank')}
                disabled
                className={`flex-1 p-4 border-2 rounded-lg opacity-50 cursor-not-allowed ${
                  paymentMethod === 'bank' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <p className="font-medium">Bank Transfer</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <>
                <div>
                  <Label htmlFor="card_name">Cardholder Name</Label>
                  <Input
                    id="card_name"
                    {...register('card_name')}
                    placeholder="John Doe"
                  />
                  {errors.card_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.card_name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="card_number">Card Number</Label>
                  <Input
                    id="card_number"
                    {...register('card_number')}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                  />
                  {errors.card_number && (
                    <p className="text-red-500 text-sm mt-1">{errors.card_number.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="card_expiry">Expiry Date</Label>
                    <Input
                      id="card_expiry"
                      {...register('card_expiry')}
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                    {errors.card_expiry && (
                      <p className="text-red-500 text-sm mt-1">{errors.card_expiry.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="card_cvc">CVC</Label>
                    <Input
                      id="card_cvc"
                      {...register('card_cvc')}
                      placeholder="123"
                      maxLength={4}
                    />
                    {errors.card_cvc && (
                      <p className="text-red-500 text-sm mt-1">{errors.card_cvc.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address_country">Country Code</Label>
                    <Input
                      id="address_country"
                      {...register('address_country')}
                      placeholder="GB"
                      maxLength={2}
                    />
                    {errors.address_country && (
                      <p className="text-red-500 text-sm mt-1">{errors.address_country.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="address_post_code">Postal Code</Label>
                    <Input
                      id="address_post_code"
                      {...register('address_post_code')}
                      placeholder="SW1A 1AA"
                    />
                    {errors.address_post_code && (
                      <p className="text-red-500 text-sm mt-1">{errors.address_post_code.message}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-blue-600">{formatPrice(50)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={paymentMutation.isPending}
            >
              {paymentMutation.isPending ? 'Processing...' : 'Complete Payment'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-gray-600 text-sm">
          <strong>Test Card:</strong> Use 4242 4242 4242 4242 with any future expiry date and any 3-digit CVC.
        </p>
      </div>
    </div>
  )
}