export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public type?: string,
    public detail?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function createProblemResponse(
  status: number,
  title: string,
  detail?: string,
  type?: string,
  instance?: string
) {
  return {
    type: type || `https://example.com/errors/${title.toLowerCase().replace(/\s+/g, '-')}`,
    title,
    status,
    detail: detail || title,
    instance,
  }
}