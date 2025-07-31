import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { stationQuerySchema } from '@/lib/validation/schemas'
import { getPaginationParams, createPaginationLinks } from '@/lib/utils/pagination'
import { createApiResponse, createErrorResponse } from '@/lib/utils/response'
import { Prisma } from '@prisma/client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const params = Object.fromEntries(searchParams.entries())
    
    // Validate query parameters
    const validation = stationQuerySchema.safeParse(params)
    if (!validation.success) {
      return createErrorResponse(400, 'Bad Request', validation.error.message)
    }

    const { page = 1, limit = 10, coordinates, search, country } = validation.data

    // Build where clause
    const where: Prisma.StationWhereInput = {}
    
    if (country) {
      where.countryCode = country
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get pagination params
    const { skip, take } = getPaginationParams(page, limit)

    // Execute queries
    const [stations, total] = await Promise.all([
      prisma.station.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      prisma.station.count({ where }),
    ])

    // If coordinates are provided, sort by distance (mock implementation)
    let sortedStations = stations
    if (coordinates) {
      // In a real implementation, you would calculate actual distances
      // For now, we'll just return the stations as-is
      sortedStations = stations
    }

    // Create response
    const baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}${req.nextUrl.pathname}`
    const links = createPaginationLinks(baseUrl, page, limit, total)

    const response = {
      data: sortedStations,
      links,
    }

    return createApiResponse(response, 200, {
      'Cache-Control': 'public, max-age=3600',
      'RateLimit': 'limit=100, remaining=99, reset=3600',
    })
  } catch (error) {
    console.error('Error fetching stations:', error)
    return createErrorResponse(500, 'Internal Server Error', 'An unexpected error occurred')
  }
}