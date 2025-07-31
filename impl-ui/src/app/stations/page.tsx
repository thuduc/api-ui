'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStations } from '@/lib/api/stations'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Station } from '@/types'

export default function StationsPage() {
  const [search, setSearch] = useState('')
  const [country, setCountry] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, error } = useQuery({
    queryKey: ['stations', { search, country, page }],
    queryFn: () => getStations({ search, country, page, limit: 12 }),
  })

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading stations</p>
        <p className="text-sm text-gray-600 mt-2">
          {error instanceof Error ? error.message : 'Unknown error occurred'}
        </p>
        <details className="mt-4 max-w-md mx-auto text-left">
          <summary className="cursor-pointer text-sm text-gray-500">Debug info</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Train Stations</h1>
        <p className="text-gray-600">Browse train stations across Europe</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Stations</CardTitle>
          <CardDescription>Filter stations by name or country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="search">Station Name</Label>
              <Input
                id="search"
                type="text"
                placeholder="Search stations..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div>
              <Label htmlFor="country">Country Code</Label>
              <Input
                id="country"
                type="text"
                placeholder="e.g., DE, FR"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value.toUpperCase())
                  setPage(1)
                }}
                maxLength={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading stations...</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.data?.map((station: Station) => (
              <Card key={station.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{station.name}</CardTitle>
                  <CardDescription>{station.countryCode}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{station.address}</p>
                  {station.timezone && (
                    <p className="text-xs text-gray-500 mt-2">
                      Timezone: {station.timezone}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {data?.data?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No stations found</p>
            </div>
          )}

          {data?.links && (data.links.prev || data.links.next) && (
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!data.links.prev}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {page}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!data.links.next}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}