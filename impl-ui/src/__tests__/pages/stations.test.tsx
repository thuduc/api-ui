import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import StationsPage from '@/app/stations/page'
import * as stationsApi from '@/lib/api/stations'

jest.mock('@/lib/api/stations')

const mockStations = {
  data: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Berlin Hauptbahnhof',
      address: 'Berlin, Germany',
      countryCode: 'DE',
      timezone: 'Europe/Berlin',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Paris Gare du Nord',
      address: 'Paris, France',
      countryCode: 'FR',
      timezone: 'Europe/Paris',
    },
  ],
  links: {
    self: '/api/stations?page=1',
    next: '/api/stations?page=2',
  },
}

const createQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderWithClient = () => {
  const queryClient = createQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <StationsPage />
    </QueryClientProvider>
  )
}

describe('Stations Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(stationsApi.getStations as jest.Mock).mockResolvedValue(mockStations)
  })

  it('should render page title', () => {
    renderWithClient()
    expect(screen.getByText('Train Stations')).toBeInTheDocument()
  })

  it('should render search inputs', () => {
    renderWithClient()
    expect(screen.getByLabelText('Station Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Country Code')).toBeInTheDocument()
  })

  it('should display stations', async () => {
    renderWithClient()

    await waitFor(() => {
      expect(screen.getByText('Berlin Hauptbahnhof')).toBeInTheDocument()
      expect(screen.getByText('Paris Gare du Nord')).toBeInTheDocument()
    })
  })

  it('should search stations by name', async () => {
    const user = userEvent.setup()
    renderWithClient()

    const searchInput = screen.getByLabelText('Station Name')
    await user.type(searchInput, 'Berlin')

    await waitFor(() => {
      expect(stationsApi.getStations).toHaveBeenCalledWith({
        search: 'Berlin',
        country: '',
        page: 1,
        limit: 12,
      })
    })
  })

  it('should filter by country code', async () => {
    const user = userEvent.setup()
    renderWithClient()

    const countryInput = screen.getByLabelText('Country Code')
    await user.type(countryInput, 'de')

    await waitFor(() => {
      expect(stationsApi.getStations).toHaveBeenCalledWith({
        search: '',
        country: 'DE',
        page: 1,
        limit: 12,
      })
    })
  })

  it('should display station details in cards', async () => {
    renderWithClient()

    await waitFor(() => {
      expect(screen.getByText('Berlin, Germany')).toBeInTheDocument()
      expect(screen.getByText('Timezone: Europe/Berlin')).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    ;(stationsApi.getStations as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    
    renderWithClient()
    expect(screen.getByText('Loading stations...')).toBeInTheDocument()
  })

  it('should show error state', async () => {
    ;(stationsApi.getStations as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    renderWithClient()

    await waitFor(() => {
      expect(screen.getByText('Error loading stations')).toBeInTheDocument()
    })
  })

  it('should show empty state', async () => {
    ;(stationsApi.getStations as jest.Mock).mockResolvedValue({ data: [] })
    
    renderWithClient()

    await waitFor(() => {
      expect(screen.getByText('No stations found')).toBeInTheDocument()
    })
  })

  it('should display pagination controls', async () => {
    renderWithClient()

    await waitFor(() => {
      expect(screen.getByText('Page 1')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    })
  })
})