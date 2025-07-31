import { NextResponse } from 'next/server'
import { createProblemResponse } from './errors'

export function createApiResponse<T>(
  data: T,
  status: number = 200,
  headers?: Record<string, string>
) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    ...headers,
  }

  return NextResponse.json(data, {
    status,
    headers: defaultHeaders,
  })
}

export function createErrorResponse(
  status: number,
  title: string,
  detail?: string,
  headers?: Record<string, string>
) {
  const problem = createProblemResponse(status, title, detail)
  
  const defaultHeaders = {
    'Content-Type': 'application/problem+json',
    ...headers,
  }

  return NextResponse.json(problem, {
    status,
    headers: defaultHeaders,
  })
}