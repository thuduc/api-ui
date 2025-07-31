import { ApiResponse, ProblemDetails } from '@/types'

export class ApiError extends Error {
  constructor(
    public status: number,
    public problem: ProblemDetails
  ) {
    super(problem.detail || problem.title)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private baseUrl: string
  private getAuthToken?: () => Promise<string | null>

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || '') {
    this.baseUrl = baseUrl
  }

  setAuthTokenGetter(getter: () => Promise<string | null>) {
    this.getAuthToken = getter
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.getAuthToken) {
      const token = await this.getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }

    return headers
  }

  async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${path}`
    const headers = await this.getHeaders()

    console.log('API Request:', { url, method: options.method || 'GET' })

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        const problem: ProblemDetails = await response.json()
        throw new ApiError(response.status, problem)
      }

      if (response.status === 204) {
        return {}
      }

      return await response.json()
    } catch (error) {
      console.error('API Error:', error)
      if (error instanceof ApiError) {
        throw error
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Failed to connect to API at ${this.baseUrl}. Is the API server running?`)
      }
      throw new Error('Network error')
    }
  }

  async get<T>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }
    const queryString = searchParams.toString()
    const fullPath = queryString ? `${path}?${queryString}` : path

    return this.request<T>(fullPath, { method: 'GET' })
  }

  async post<T>(path: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete(path: string): Promise<void> {
    await this.request(path, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()