import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider } from 'next-auth/react'
import BookingsPage from '@/app/bookings/page'
import * as bookingsApi from '@/lib/api/bookings'

jest.mock('@/lib/api/bookings')
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: () => ({
    data: { user: { id: 'user-1', email: 'test@example.com' } },
    status: 'authenticated',
  }),
}))

const mockBookings = {
  data: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      trip_id: '550e8400-e29b-41d4-a716-446655440002',
      passenger_name: 'John Doe',
      has_bicycle: true,
      has_dog: false,
      status: 'pending',
      expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      created_at: new Date().toISOString(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      trip_id: '550e8400-e29b-41d4-a716-446655440004',
      passenger_name: 'Jane Smith',
      has_bicycle: false,
      has_dog: true,
      status: 'confirmed',
      created_at: new Date().toISOString(),
    },
  ],
}

const createQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderWithProviders = () => {
  const queryClient = createQueryClient()
  return render(
    <SessionProvider session={{ user: { id: 'user-1' }, expires: '' }}>
      <QueryClientProvider client={queryClient}>
        <BookingsPage />
      </QueryClientProvider>
    </SessionProvider>
  )
}

describe('Bookings Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(bookingsApi.getBookings as jest.Mock).mockResolvedValue(mockBookings)
  })

  it('should render page title', async () => {
    renderWithProviders()
    await waitFor(() => {
      expect(screen.getByText('My Bookings')).toBeInTheDocument()
    })
  })

  it('should display bookings list', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText(/Booking #.*55440001/)).toBeInTheDocument()
      expect(screen.getByText(/Booking #.*55440003/)).toBeInTheDocument()
    })
  })

  it('should display booking details', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })
  })

  it('should show booking status', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Confirmed')).toBeInTheDocument()
    })
  })

  it('should show payment button for pending bookings', async () => {
    renderWithProviders()

    await waitFor(() => {
      const paymentButtons = screen.getAllByRole('button', { name: 'Complete Payment' })
      expect(paymentButtons).toHaveLength(1)
    })
  })

  it('should show cancel button for pending bookings', async () => {
    renderWithProviders()

    await waitFor(() => {
      const cancelButtons = screen.getAllByRole('button', { name: 'Cancel' })
      expect(cancelButtons).toHaveLength(1)
    })
  })

  it('should show payment confirmed for confirmed bookings', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('✓ Payment confirmed')).toBeInTheDocument()
    })
  })

  it('should handle cancel booking', async () => {
    const mockCancelBooking = jest.fn().mockResolvedValue(undefined)
    ;(bookingsApi.cancelBooking as jest.Mock) = mockCancelBooking

    window.confirm = jest.fn().mockReturnValue(true)
    const user = userEvent.setup()
    
    renderWithProviders()

    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      user.click(cancelButton)
    })

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to cancel this booking?')
      expect(mockCancelBooking).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440001')
    })
  })

  it('should show empty state when no bookings', async () => {
    ;(bookingsApi.getBookings as jest.Mock).mockResolvedValue({ data: [] })
    
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText("You don't have any bookings yet")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Search for trips' })).toBeInTheDocument()
    })
  })

  it('should show loading state', () => {
    ;(bookingsApi.getBookings as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    
    renderWithProviders()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show error state', async () => {
    ;(bookingsApi.getBookings as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Error loading bookings')).toBeInTheDocument()
    })
  })

  it('should display expiry time for pending bookings', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText(/Expires at:/)).toBeInTheDocument()
    })
  })

  it('should show bicycle and dog info when applicable', async () => {
    renderWithProviders()

    await waitFor(() => {
      // First booking has bicycle
      const bicycleElements = screen.getAllByText('Bicycle:')
      expect(bicycleElements[0].nextSibling?.textContent).toBe('Yes')
      
      // Second booking has dog
      const dogElements = screen.getAllByText('Dog:')
      expect(dogElements[0].nextSibling?.textContent).toBe('Yes')
    })
  })
})