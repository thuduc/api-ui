export function getPaginationParams(page: number = 1, limit: number = 10) {
  const skip = (page - 1) * limit
  return { skip, take: limit }
}

export function createPaginationLinks(
  baseUrl: string,
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit)
  const links: any = {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
  }

  if (page < totalPages) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`
  }

  if (page > 1) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`
  }

  return links
}