import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StationSelect } from '@/components/station-select'
import * as stationsApi from '@/lib/api/stations'

jest.mock('@/lib/api/stations')

const mockStations = {
  data: [
    {
      id: 'station-1',
      name: 'Berlin Hauptbahnhof',
      address: 'Berlin, Germany',
      countryCode: 'DE',
    },
    {
      id: 'station-2',
      name: 'Paris Gare du Nord',
      address: 'Paris, France',
      countryCode: 'FR',
    },
  ],
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('StationSelect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(stationsApi.getStations as jest.Mock).mockResolvedValue(mockStations)
  })

  it('should render with placeholder', () => {
    renderWithClient(<StationSelect onChange={() => {}} placeholder="Select station" />)
    expect(screen.getByText('Select station')).toBeInTheDocument()
  })

  it('should open dropdown on click', async () => {
    const user = userEvent.setup()
    renderWithClient(<StationSelect onChange={() => {}} />)

    await user.click(screen.getByRole('button'))
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search stations...')).toBeInTheDocument()
    })
  })

  it('should display stations in dropdown', async () => {
    const user = userEvent.setup()
    renderWithClient(<StationSelect onChange={() => {}} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('Berlin Hauptbahnhof')).toBeInTheDocument()
      expect(screen.getByText('Paris Gare du Nord')).toBeInTheDocument()
    })
  })

  it('should filter stations by search', async () => {
    const user = userEvent.setup()
    renderWithClient(<StationSelect onChange={() => {}} />)

    await user.click(screen.getByRole('button'))
    
    const searchInput = await screen.findByPlaceholderText('Search stations...')
    await user.type(searchInput, 'Berlin')

    expect(stationsApi.getStations).toHaveBeenCalledWith({
      search: 'Berlin',
      limit: 10,
    })
  })

  it('should select a station', async () => {
    const handleChange = jest.fn()
    const user = userEvent.setup()
    renderWithClient(<StationSelect onChange={handleChange} />)

    await user.click(screen.getByRole('button'))
    
    const berlinStation = await screen.findByText('Berlin Hauptbahnhof')
    await user.click(berlinStation)

    expect(handleChange).toHaveBeenCalledWith('station-1')
  })

  it('should display selected station', () => {
    renderWithClient(<StationSelect value="station-1" onChange={() => {}} />)

    waitFor(() => {
      expect(screen.getByText('Berlin Hauptbahnhof (DE)')).toBeInTheDocument()
    })
  })

  it('should show no results message when no stations found', async () => {
    ;(stationsApi.getStations as jest.Mock).mockResolvedValue({ data: [] })
    
    const user = userEvent.setup()
    renderWithClient(<StationSelect onChange={() => {}} />)

    await user.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('No stations found')).toBeInTheDocument()
    })
  })
})