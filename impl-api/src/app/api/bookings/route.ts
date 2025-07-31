import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createBookingSchema, paginationSchema } from '@/lib/validation/schemas'
import { getPaginationParams, createPaginationLinks } from '@/lib/utils/pagination'
import { createApiResponse, createErrorResponse } from '@/lib/utils/response'
import { requireAuth, requireWriteScope } from '@/lib/auth/utils'

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const { error, userId } = await requireAuth(req)
    if (error) return error

    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    // Validate pagination parameters
    const validation = paginationSchema.safeParse(params)
    if (!validation.success) {
      return createErrorResponse(400, 'Bad Request', validation.error.message)
    }

    const { page = 1, limit = 10 } = validation.data
    const { skip, take } = getPaginationParams(page, limit)

    // Get user's bookings
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          trip: {
            include: {
              origin: true,
              destination: true,
            },
          },
        },
      }),
      prisma.booking.count({ where: { userId } }),
    ])

    // Format bookings
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      trip_id: booking.tripId,
      passenger_name: booking.passengerName,
      has_bicycle: booking.hasBicycle,
      has_dog: booking.hasDog,
      status: booking.status,
      expires_at: booking.expiresAt?.toISOString(),
      created_at: booking.createdAt.toISOString(),
    }))

    // Create response
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}${req.nextUrl.pathname}`
    const links = createPaginationLinks(baseUrl, page, limit, total)

    const response = {
      data: formattedBookings,
      links,
    }

    return createApiResponse(response, 200, {
      'Cache-Control': 'no-cache',
      'RateLimit': 'limit=100, remaining=99, reset=3600',
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return createErrorResponse(500, 'Internal Server Error', 'An unexpected error occurred')
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication and write scope
    const { error, userId } = await requireWriteScope(req)
    if (error) return error

    // Parse and validate request body
    const body = await req.json()
    const validation = createBookingSchema.safeParse(body)
    if (!validation.success) {
      return createErrorResponse(400, 'Bad Request', validation.error.message)
    }

    const { trip_id, passenger_name, has_bicycle, has_dog } = validation.data

    // Check if trip exists and has availability
    const trip = await prisma.trip.findUnique({
      where: { id: trip_id },
    })

    if (!trip) {
      return createErrorResponse(404, 'Not Found', 'Trip not found')
    }

    // Check if trip allows bicycles/dogs if requested
    if (has_bicycle && !trip.bicyclesAllowed) {
      return createErrorResponse(400, 'Bad Request', 'Bicycles are not allowed on this trip')
    }

    if (has_dog && !trip.dogsAllowed) {
      return createErrorResponse(400, 'Bad Request', 'Dogs are not allowed on this trip')
    }

    // Create booking with 1 hour expiry
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1)

    const booking = await prisma.booking.create({
      data: {
        tripId: trip_id,
        userId,
        passengerName: passenger_name,
        hasBicycle: has_bicycle,
        hasDog: has_dog,
        status: 'pending',
        expiresAt,
      },
    })

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

    return createApiResponse(response, 201, {
      'Cache-Control': 'no-cache',
      'RateLimit': 'limit=100, remaining=99, reset=3600',
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    return createErrorResponse(500, 'Internal Server Error', 'An unexpected error occurred')
  }
}