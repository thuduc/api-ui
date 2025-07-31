import { ApiClient, ApiError } from '@/lib/api/client'

// Mock fetch
global.fetch = jest.fn()

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient('http://localhost:3000')
    jest.clearAllMocks()
  })

  describe('request', () => {
    it('should make successful GET request', async () => {
      const mockResponse = { data: [{ id: '1', name: 'Test' }] }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.get('/api/test')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should handle query parameters', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })

      await client.get('/api/test', { page: 1, limit: 10, search: 'test' })

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test?page=1&limit=10&search=test',
        expect.any(Object)
      )
    })

    it('should throw ApiError on error response', async () => {
      const problemDetails = {
        type: 'https://example.com/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Resource not found',
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => problemDetails,
      })

      await expect(client.get('/api/test')).rejects.toThrow(ApiError)
      
      const error = await client.get('/api/test').catch(e => e)
      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(404)
      expect(error.problem).toEqual(problemDetails)
    })

    it('should handle 204 No Content response', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      })

      const result = await client.delete('/api/test/123')

      expect(result).toBeUndefined()
    })

    it('should make POST request with data', async () => {
      const postData = { name: 'Test', value: 123 }
      const mockResponse = { id: '1', ...postData }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await client.post('/api/test', postData)

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      )
      expect(result).toEqual(mockResponse)
    })

    it('should include auth token when set', async () => {
      const mockToken = 'test-token-123'
      client.setAuthTokenGetter(async () => mockToken)

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
      })

      await client.get('/api/test')

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`,
          }),
        })
      )
    })

    it('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      await expect(client.get('/api/test')).rejects.toThrow('Network error')
    })
  })
})