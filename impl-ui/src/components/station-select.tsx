'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getStations } from '@/lib/api/stations'
import { Station } from '@/types'

interface StationSelectProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
}

export function StationSelect({ value, onChange, placeholder = 'Select station' }: StationSelectProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { data } = useQuery({
    queryKey: ['stations', { search, limit: 10 }],
    queryFn: () => getStations({ search, limit: 10 }),
  })

  const selectedStation = data?.data?.find((s: Station) => s.id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {selectedStation ? (
          <span>{selectedStation.name} ({selectedStation.countryCode})</span>
        ) : (
          <span className="text-gray-400">{placeholder}</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="p-2">
            <input
              type="text"
              className="w-full px-3 py-1 border border-gray-300 rounded-md"
              placeholder="Search stations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-auto">
            {data?.data?.map((station: Station) => (
              <button
                key={station.id}
                type="button"
                onClick={() => {
                  onChange(station.id)
                  setIsOpen(false)
                  setSearch('')
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                <div className="font-medium">{station.name}</div>
                <div className="text-sm text-gray-500">{station.address}</div>
              </button>
            ))}
            {data?.data?.length === 0 && (
              <div className="px-4 py-2 text-gray-500">No stations found</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}