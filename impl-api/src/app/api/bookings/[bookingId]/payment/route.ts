import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createPaymentSchema } from '@/lib/validation/schemas'
import { createApiResponse, createErrorResponse } from '@/lib/utils/response'
import { requireAuth } from '@/lib/auth/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    // Check authentication
    const { error, userId } = await requireAuth(req)
    if (error) return error

    const { bookingId } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(bookingId)) {
      return createErrorResponse(400, 'Bad Request', 'Invalid booking ID format')
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = createPaymentSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(400, 'Bad Request', validation.error.message)
    }

    const { amount, currency, source } = validation.data

    // Get booking with trip details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: true,
        payments: {
          where: { status: 'succeeded' },
        },
      },
    })

    if (!booking) {
      return createErrorResponse(404, 'Not Found', 'Booking not found')
    }

    // Check if user owns this booking
    if (booking.userId !== userId) {
      return createErrorResponse(403, 'Forbidden', 'Access denied to this booking')
    }

    // Check if booking is already paid
    if (booking.payments.length > 0) {
      return createErrorResponse(409, 'Conflict', 'Booking is already paid')
    }

    // Check if booking has expired
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      return createErrorResponse(400, 'Bad Request', 'Booking has expired')
    }

    // Verify payment amount matches trip price
    if (amount !== booking.trip.price) {
      return createErrorResponse(
        400,
        'Bad Request',
        `Payment amount must match trip price of ${booking.trip.price}`
      )
    }

    // Mask sensitive payment source data
    const maskedSource = maskPaymentSource(source)

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId,
        amount,
        currency,
        sourceType: source.object,
        sourceDetails: JSON.stringify(maskedSource),
        status: 'pending',
      },
    })

    // Simulate payment processing (in real implementation, call payment provider)
    const paymentSucceeded = await processPayment(source, amount, currency)

    // Update payment and booking status
    const [updatedPayment, updatedBooking] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: paymentSucceeded ? 'succeeded' : 'failed' },
      }),
      paymentSucceeded
        ? prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'confirmed' },
          })
        : Promise.resolve(booking),
    ])

    // Format response
    const response = {
      id: updatedPayment.id,
      amount: updatedPayment.amount,
      currency: updatedPayment.currency,
      source: maskedSource,
      status: updatedPayment.status,
      links: {
        booking: `${req.nextUrl.protocol}//${req.nextUrl.host}/api/bookings/${bookingId}`,
      },
    }

    return createApiResponse(response, 200, {
      'Cache-Control': 'no-cache',
      'RateLimit': 'limit=100, remaining=99, reset=3600',
    })
  } catch (error) {
    console.error('Error processing payment:', error)
    return createErrorResponse(500, 'Internal Server Error', 'An unexpected error occurred')
  }
}

function maskPaymentSource(source: any) {
  if (source.object === 'card') {
    return {
      object: 'card',
      name: source.name,
      number: `************${source.number.slice(-4)}`,
      exp_month: source.exp_month,
      exp_year: source.exp_year,
      address_country: source.address_country,
      address_post_code: source.address_post_code,
    }
  } else if (source.object === 'bank_account') {
    return {
      object: 'bank_account',
      name: source.name,
      account_type: source.account_type,
      number: `*********${source.number.slice(-4)}`,
      sort_code: source.sort_code,
      bank_name: source.bank_name,
      country: source.country,
    }
  }
  return source
}

async function processPayment(source: any, amount: number, currency: string): Promise<boolean> {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 100))
  
  // In a real implementation, this would:
  // 1. Call the payment provider API
  // 2. Handle various payment states
  // 3. Store transaction references
  
  // For testing, simulate 90% success rate
  return Math.random() > 0.1
}