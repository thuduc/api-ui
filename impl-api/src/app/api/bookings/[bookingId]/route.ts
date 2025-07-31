import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createApiResponse, createErrorResponse } from '@/lib/utils/response'
import { requireAuth, requireWriteScope } from '@/lib/auth/utils'

export async function GET(
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

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        trip: {
          include: {
            origin: true,
            destination: true,
          },
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

    // Format response
    const response = {
      id: booking.id,
      trip_id: booking.tripId,
      passenger_name: booking.passengerName,
      has_bicycle: booking.hasBicycle,
      has_dog: booking.hasDog,
      status: booking.status,
      expires_at: booking.expiresAt?.toISOString(),
      created_at: booking.createdAt.toISOString(),
      links: {
        self: `${req.nextUrl.protocol}//${req.nextUrl.host}/api/bookings/${booking.id}`,
      },
    }

    return createApiResponse(response, 200, {
      'Cache-Control': 'no-cache',
      'RateLimit': 'limit=100, remaining=99, reset=3600',
    })
  } catch (error) {
    console.error('Error fetching booking:', error)
    return createErrorResponse(500, 'Internal Server Error', 'An unexpected error occurred')
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    // Check authentication and write scope
    const { error, userId } = await requireWriteScope(req)
    if (error) return error

    const { bookingId } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(bookingId)) {
      return createErrorResponse(400, 'Bad Request', 'Invalid booking ID format')
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return createErrorResponse(404, 'Not Found', 'Booking not found')
    }

    // Check if user owns this booking
    if (booking.userId !== userId) {
      return createErrorResponse(403, 'Forbidden', 'Access denied to this booking')
    }

    // Check if booking can be cancelled
    if (booking.status === 'confirmed') {
      return createErrorResponse(400, 'Bad Request', 'Cannot cancel a confirmed booking')
    }

    // Delete booking
    await prisma.booking.delete({
      where: { id: bookingId },
    })

    return new Response(null, {
      status: 204,
      headers: {
        'Cache-Control': 'no-cache',
        'RateLimit': 'limit=100, remaining=99, reset=3600',
      },
    })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return createErrorResponse(500, 'Internal Server Error', 'An unexpected error occurred')
  }
}