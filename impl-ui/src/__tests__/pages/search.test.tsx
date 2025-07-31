import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SearchPage from '@/app/search/page'
import * as tripsApi from '@/lib/api/trips'
import * as stationsApi from '@/lib/api/stations'

jest.mock('@/lib/api/trips')
jest.mock('@/lib/api/stations')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockStations = {
  data: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Berlin Hauptbahnhof',
      address: 'Berlin, Germany',
      countryCode: 'DE',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Paris Gare du Nord',
      address: 'Paris, France',
      countryCode: 'FR',
    },
  ],
}

const mockTrips = {
  data: [
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      origin: '550e8400-e29b-41d4-a716-446655440001',
      destination: '550e8400-e29b-41d4-a716-446655440002',
      departure_time: '2024-02-01T10:00:00Z',
      arrival_time: '2024-02-01T16:00:00Z',
      operator: 'Test Railway',
      price: 50,
      bicycles_allowed: true,
      dogs_allowed: false,
    },
  ],
}

const createQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderWithClient = () => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <SearchPage />
    </QueryClientProvider>
  )
}

describe('Search Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(stationsApi.getStations as jest.Mock).mockResolvedValue(mockStations)
    ;(tripsApi.getTrips as jest.Mock).mockResolvedValue(mockTrips)
  })

  it('should render page title', () => {
    renderWithClient()
    expect(screen.getByText('Search Trips')).toBeInTheDocument()
  })

  it('should render search form', () => {
    renderWithClient()
    
    expect(screen.getByText('Origin Station')).toBeInTheDocument()
    expect(screen.getByText('Destination Station')).toBeInTheDocument()
    expect(screen.getByLabelText('Travel Date')).toBeInTheDocument()
    expect(screen.getByText('Bicycles allowed')).toBeInTheDocument()
    expect(screen.getByText('Dogs allowed')).toBeInTheDocument()
  })

  it('should have default date as today', () => {
    renderWithClient()
    
    const dateInput = screen.getByLabelText('Travel Date') as HTMLInputElement
    const today = new Date().toISOString().split('T')[0]
    expect(dateInput.value).toBe(today)
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    renderWithClient()

    const searchButton = screen.getByRole('button', { name: 'Search Trips' })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText('Please select a valid origin station')).toBeInTheDocument()
      expect(screen.getByText('Please select a valid destination station')).toBeInTheDocument()
    })
  })

  it('should search for trips on form submission', async () => {
    const user = userEvent.setup()
    renderWithClient()

    // Find and open origin dropdown
    const originButton = screen.getByText('Select origin')
    await user.click(originButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Berlin Hauptbahnhof'))

    // Find and open destination dropdown
    const destButton = screen.getByText('Select destination')
    await user.click(destButton)
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
    
    await user.click(screen.getByText('Paris Gare du Nord'))

    // Submit form
    await user.click(screen.getByRole('button', { name: 'Search Trips' }))

    await waitFor(() => {
      expect(tripsApi.getTrips).toHaveBeenCalledWith({
        origin: '550e8400-e29b-41d4-a716-446655440001',
        destination: '550e8400-e29b-41d4-a716-446655440002',
        date: expect.any(String),
        bicycles: false,
        dogs: false,
      })
    })
  })

  it('should display search results', async () => {
    const user = userEvent.setup()
    renderWithClient()

    // Perform search
    const originButton = screen.getByText('Select origin')
    await user.click(originButton)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Berlin Hauptbahnhof'))

    const destButton = screen.getByText('Select destination')
    await user.click(destButton)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Paris Gare du Nord'))

    await user.click(screen.getByRole('button', { name: 'Search Trips' }))

    await waitFor(() => {
      expect(screen.getByText('Available Trips')).toBeInTheDocument()
      expect(screen.getByText('Test Railway')).toBeInTheDocument()
      expect(screen.getByText('€50.00')).toBeInTheDocument()
    })
  })

  it('should show no results message', async () => {
    ;(tripsApi.getTrips as jest.Mock).mockResolvedValue({ data: [] })
    
    const user = userEvent.setup()
    renderWithClient()

    // Perform search
    const originButton = screen.getByText('Select origin')
    await user.click(originButton)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Berlin Hauptbahnhof'))

    const destButton = screen.getByText('Select destination')
    await user.click(destButton)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Paris Gare du Nord'))

    await user.click(screen.getByRole('button', { name: 'Search Trips' }))

    await waitFor(() => {
      expect(screen.getByText('No trips found for your search criteria')).toBeInTheDocument()
    })
  })

  it('should handle filter options', async () => {
    const user = userEvent.setup()
    renderWithClient()

    // Check bicycles and dogs filters
    await user.click(screen.getByRole('checkbox', { name: /bicycles allowed/i }))
    await user.click(screen.getByRole('checkbox', { name: /dogs allowed/i }))

    // Perform search with filters
    const originButton = screen.getByText('Select origin')
    await user.click(originButton)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Berlin Hauptbahnhof'))

    const destButton = screen.getByText('Select destination')
    await user.click(destButton)
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
    await user.click(screen.getByText('Paris Gare du Nord'))

    await user.click(screen.getByRole('button', { name: 'Search Trips' }))

    await waitFor(() => {
      expect(tripsApi.getTrips).toHaveBeenCalledWith(
        expect.objectContaining({
          bicycles: true,
          dogs: true,
        })
      )
    })
  })
})