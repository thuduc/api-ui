import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TripCard } from '@/components/trip-card'
import * as stationsApi from '@/lib/api/stations'

jest.mock('@/lib/api/stations')

const mockTrip = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  origin: '550e8400-e29b-41d4-a716-446655440002',
  destination: '550e8400-e29b-41d4-a716-446655440003',
  departure_time: '2024-02-01T10:00:00Z',
  arrival_time: '2024-02-01T16:00:00Z',
  operator: 'Test Railway',
  price: 50,
  bicycles_allowed: true,
  dogs_allowed: false,
}

const mockStations = {
  data: [
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Berlin Hauptbahnhof',
      address: 'Berlin, Germany',
      countryCode: 'DE',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Paris Gare du Nord',
      address: 'Paris, France',
      countryCode: 'FR',
    },
  ],
}

const createQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('TripCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(stationsApi.getStations as jest.Mock).mockResolvedValue(mockStations)
  })

  it('should display station names', async () => {
    renderWithClient(<TripCard trip={mockTrip} onBook={() => {}} />)
    
    await waitFor(() => {
      expect(screen.getByText('Berlin Hauptbahnhof')).toBeInTheDocument()
      expect(screen.getByText('Paris Gare du Nord')).toBeInTheDocument()
    })
  })

  it('should display operator name', () => {
    renderWithClient(<TripCard trip={mockTrip} onBook={() => {}} />)
    
    expect(screen.getByText('Test Railway')).toBeInTheDocument()
  })

  it('should display formatted price', () => {
    renderWithClient(<TripCard trip={mockTrip} onBook={() => {}} />)
    
    expect(screen.getByText('€50.00')).toBeInTheDocument()
  })

  it('should display trip times', () => {
    renderWithClient(<TripCard trip={mockTrip} onBook={() => {}} />)
    
    // Should show formatted times
    const timeElements = screen.getAllByText(/^\d{1,2}:\d{2}/)
    expect(timeElements.length).toBeGreaterThan(0)
  })

  it('should display trip duration', () => {
    renderWithClient(<TripCard trip={mockTrip} onBook={() => {}} />)
    
    expect(screen.getByText(/6h 0m/)).toBeInTheDocument()
  })

  it('should show bicycle allowed indicator when applicable', () => {
    renderWithClient(<TripCard trip={mockTrip} onBook={() => {}} />)
    
    expect(screen.getByText(/🚲.*Bicycles allowed/)).toBeInTheDocument()
  })

  it('should not show bicycle indicator when not allowed', () => {
    const tripNoBikes = { ...mockTrip, bicycles_allowed: false }
    renderWithClient(<TripCard trip={tripNoBikes} onBook={() => {}} />)
    
    expect(screen.queryByText(/🚲.*Bicycles allowed/)).not.toBeInTheDocument()
  })

  it('should show dog allowed indicator when applicable', () => {
    const tripWithDogs = { ...mockTrip, dogs_allowed: true }
    renderWithClient(<TripCard trip={tripWithDogs} onBook={() => {}} />)
    
    expect(screen.getByText(/🐕.*Dogs allowed/)).toBeInTheDocument()
  })

  it('should not show dog indicator when not allowed', () => {
    renderWithClient(<TripCard trip={mockTrip} onBook={() => {}} />)
    
    expect(screen.queryByText(/🐕.*Dogs allowed/)).not.toBeInTheDocument()
  })

  it('should call onBook when button is clicked', async () => {
    const handleBook = jest.fn()
    const user = userEvent.setup()
    
    renderWithClient(<TripCard trip={mockTrip} onBook={handleBook} />)
    
    await user.click(screen.getByRole('button', { name: 'Book this trip' }))
    
    expect(handleBook).toHaveBeenCalled()
  })

  it('should show loading state while fetching stations', () => {
    ;(stationsApi.getStations as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    
    renderWithClient(<TripCard trip={mockTrip} onBook={() => {}} />)
    
    expect(screen.getAllByText('Loading...')).toHaveLength(2)
  })

  it('should format price with different amounts', () => {
    const tripExpensive = { ...mockTrip, price: 123.45 }
    renderWithClient(<TripCard trip={tripExpensive} onBook={() => {}} />)
    
    expect(screen.getByText('€123.45')).toBeInTheDocument()
  })

  it('should calculate duration correctly for short trips', () => {
    const tripShort = {
      ...mockTrip,
      departure_time: '2024-02-01T10:00:00Z',
      arrival_time: '2024-02-01T11:30:00Z',
    }
    
    renderWithClient(<TripCard trip={tripShort} onBook={() => {}} />)
    
    expect(screen.getByText(/1h 30m/)).toBeInTheDocument()
  })

  it('should handle both bicycle and dog allowed', () => {
    const tripWithBoth = { 
      ...mockTrip, 
      bicycles_allowed: true,
      dogs_allowed: true,
    }
    renderWithClient(<TripCard trip={tripWithBoth} onBook={() => {}} />)
    
    expect(screen.getByText(/🚲.*Bicycles allowed/)).toBeInTheDocument()
    expect(screen.getByText(/🐕.*Dogs allowed/)).toBeInTheDocument()
  })

  it('should handle neither bicycle nor dog allowed', () => {
    const tripWithNeither = { 
      ...mockTrip, 
      bicycles_allowed: false,
      dogs_allowed: false,
    }
    renderWithClient(<TripCard trip={tripWithNeither} onBook={() => {}} />)
    
    expect(screen.queryByText(/🚲.*Bicycles allowed/)).not.toBeInTheDocument()
    expect(screen.queryByText(/🐕.*Dogs allowed/)).not.toBeInTheDocument()
  })
})