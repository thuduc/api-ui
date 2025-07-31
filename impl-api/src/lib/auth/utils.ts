import { getServerSession } from 'next-auth'
import { authOptions } from './options'
import { NextRequest } from 'next/server'
import { createErrorResponse } from '@/lib/utils/response'

export async function requireAuth(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return {
      error: createErrorResponse(401, 'Unauthorized', 'Authentication required'),
      userId: null,
    }
  }

  return {
    error: null,
    userId: session.user.id,
  }
}

export async function requireWriteScope(req: NextRequest) {
  // In a real implementation, this would check OAuth scopes
  // For now, we'll just check if the user is authenticated
  const { error, userId } = await requireAuth(req)
  
  if (error) {
    return { error, userId: null }
  }

  // Mock scope check
  const hasWriteScope = true // In real implementation, check token scopes
  
  if (!hasWriteScope) {
    return {
      error: createErrorResponse(403, 'Forbidden', 'Write scope required'),
      userId: null,
    }
  }

  return { error: null, userId }
}