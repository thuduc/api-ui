import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { tripQuerySchema } from '@/lib/validation/schemas'
import { getPaginationParams, createPaginationLinks } from '@/lib/utils/pagination'
import { createApiResponse, createErrorResponse } from '@/lib/utils/response'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validation = tripQuerySchema.safeParse(params)
    if (!validation.success) {
      return createErrorResponse(400, 'Bad Request', validation.error.message)
    }

    const { 
      page = 1, 
      limit = 10, 
      origin, 
      destination, 
      date, 
      bicycles, 
      dogs 
    } = validation.data

    // Parse date to get start and end of day
    const searchDate = new Date(date)
    const startOfDay = new Date(searchDate)
    startOfDay.setUTCHours(0, 0, 0, 0)
    const endOfDay = new Date(searchDate)
    endOfDay.setUTCHours(23, 59, 59, 999)

    // Build where clause
    const where: Prisma.TripWhereInput = {
      originId: origin,
      destinationId: destination,
      departureTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
    }

    // Add optional filters
    if (bicycles === true) {
      where.bicyclesAllowed = true
    }
    if (dogs === true) {
      where.dogsAllowed = true
    }

    // Get pagination params
    const { skip, take } = getPaginationParams(page, limit)

    // Execute queries
    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take,
        orderBy: { departureTime: 'asc' },
        include: {
          origin: true,
          destination: true,
        },
      }),
      prisma.trip.count({ where }),
    ])

    // Format trips with links
    const formattedTrips = trips.map(trip => ({
      id: trip.id,
      origin: trip.originId,
      destination: trip.destinationId,
      departure_time: trip.departureTime.toISOString(),
      arrival_time: trip.arrivalTime.toISOString(),
      operator: trip.operator,
      price: trip.price,
      bicycles_allowed: trip.bicyclesAllowed,
      dogs_allowed: trip.dogsAllowed,
      links: {
        self: `${req.nextUrl.protocol}//${req.nextUrl.host}/api/trips/${trip.id}`,
        origin: `${req.nextUrl.protocol}//${req.nextUrl.host}/api/stations/${trip.originId}`,
        destination: `${req.nextUrl.protocol}//${req.nextUrl.host}/api/stations/${trip.destinationId}`,
      },
    }))

    // Create response
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}${req.nextUrl.pathname}`
    const links = createPaginationLinks(baseUrl, page, limit, total)

    // Add query params to links
    const queryString = `origin=${origin}&destination=${destination}&date=${date}`
    links.self += `&${queryString}`
    if (links.next) links.next += `&${queryString}`
    if (links.prev) links.prev += `&${queryString}`

    const response = {
      data: formattedTrips,
      links,
    }

    return createApiResponse(response, 200, {
      'Cache-Control': 'public, max-age=300',
      'RateLimit': 'limit=100, remaining=99, reset=3600',
    })
  } catch (error) {
    console.error('Error fetching trips:', error)
    return createErrorResponse(500, 'Internal Server Error', 'An unexpected error occurred')
  }
}