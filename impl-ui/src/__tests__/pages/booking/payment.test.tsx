import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import PaymentPage from '@/app/booking/[bookingId]/payment/page'
import * as bookingsApi from '@/lib/api/bookings'
import * as paymentsApi from '@/lib/api/payments'

jest.mock('@/lib/api/bookings')
jest.mock('@/lib/api/payments')
jest.mock('next-auth/react', () => ({
  ...jest.requireActual('next-auth/react'),
  useSession: () => ({
    data: { user: { id: 'user-1', email: 'test@example.com' } },
    status: 'authenticated',
  }),
}))

const mockPush = jest.fn()

const mockBooking = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  trip_id: '550e8400-e29b-41d4-a716-446655440002',
  passenger_name: 'John Doe',
  has_bicycle: true,
  has_dog: false,
  status: 'pending',
  expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
  created_at: new Date().toISOString(),
  trip: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    origin: { name: 'Berlin Hauptbahnhof' },
    destination: { name: 'Paris Gare du Nord' },
    departure_time: '2024-02-01T10:00:00Z',
    arrival_time: '2024-02-01T16:00:00Z',
    operator: 'Test Railway',
    price: 50,
  },
}

const createQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const renderWithProviders = () => {
  const queryClient = createQueryClient()
  return render(
    <SessionProvider session={{ user: { id: 'user-1' }, expires: '' }}>
      <QueryClientProvider client={queryClient}>
        <PaymentPage params={{ bookingId: '550e8400-e29b-41d4-a716-446655440001' }} />
      </QueryClientProvider>
    </SessionProvider>
  )
}

describe('Payment Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { useRouter } = require('next/navigation')
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    ;(bookingsApi.getBooking as jest.Mock).mockResolvedValue(mockBooking)
  })

  it('should display booking details', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Complete Payment')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Berlin Hauptbahnhof → Paris Gare du Nord')).toBeInTheDocument()
      expect(screen.getByText('€50.00')).toBeInTheDocument()
    })
  })

  it('should show expiry warning', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText(/This booking expires at/)).toBeInTheDocument()
    })
  })

  it('should render payment form', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByLabelText('Card Number')).toBeInTheDocument()
      expect(screen.getByLabelText('Expiry (MM/YY)')).toBeInTheDocument()
      expect(screen.getByLabelText('CVV')).toBeInTheDocument()
      expect(screen.getByLabelText('Cardholder Name')).toBeInTheDocument()
    })
  })

  it('should validate card number', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await waitFor(() => {
      screen.getByLabelText('Card Number')
    })

    await user.type(screen.getByLabelText('Card Number'), '1234')
    await user.click(screen.getByRole('button', { name: 'Pay €50.00' }))

    await waitFor(() => {
      expect(screen.getByText('Card number must be 16 digits')).toBeInTheDocument()
    })
  })

  it('should validate expiry date', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await waitFor(() => {
      screen.getByLabelText('Expiry (MM/YY)')
    })

    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1')
    await user.click(screen.getByRole('button', { name: 'Pay €50.00' }))

    await waitFor(() => {
      expect(screen.getByText('Expiry must be in MM/YY format')).toBeInTheDocument()
    })
  })

  it('should validate CVV', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await waitFor(() => {
      screen.getByLabelText('CVV')
    })

    await user.type(screen.getByLabelText('CVV'), '12')
    await user.click(screen.getByRole('button', { name: 'Pay €50.00' }))

    await waitFor(() => {
      expect(screen.getByText('CVV must be 3 or 4 digits')).toBeInTheDocument()
    })
  })

  it('should process payment successfully', async () => {
    const mockPayment = {
      id: '550e8400-e29b-41d4-a716-446655440003',
      booking_id: '550e8400-e29b-41d4-a716-446655440001',
      amount: 50,
      status: 'completed',
      card_last_four: '4242',
    }
    ;(paymentsApi.processPayment as jest.Mock).mockResolvedValue(mockPayment)

    const user = userEvent.setup()
    renderWithProviders()

    await waitFor(() => {
      screen.getByLabelText('Card Number')
    })

    await user.type(screen.getByLabelText('Card Number'), '4242424242424242')
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '12/25')
    await user.type(screen.getByLabelText('CVV'), '123')
    await user.type(screen.getByLabelText('Cardholder Name'), 'John Doe')
    await user.click(screen.getByRole('button', { name: 'Pay €50.00' }))

    await waitFor(() => {
      expect(paymentsApi.processPayment).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440001',
        {
          card_number: '4242424242424242',
          expiry_month: 12,
          expiry_year: 2025,
          cvv: '123',
          cardholder_name: 'John Doe',
        }
      )
      expect(mockPush).toHaveBeenCalledWith('/bookings')
    })
  })

  it('should show processing state', async () => {
    ;(paymentsApi.processPayment as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    )

    const user = userEvent.setup()
    renderWithProviders()

    await waitFor(() => {
      screen.getByLabelText('Card Number')
    })

    await user.type(screen.getByLabelText('Card Number'), '4242424242424242')
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '12/25')
    await user.type(screen.getByLabelText('CVV'), '123')
    await user.type(screen.getByLabelText('Cardholder Name'), 'John Doe')
    await user.click(screen.getByRole('button', { name: 'Pay €50.00' }))

    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('should handle payment error', async () => {
    ;(paymentsApi.processPayment as jest.Mock).mockRejectedValue(
      new Error('Payment failed')
    )

    const user = userEvent.setup()
    renderWithProviders()

    await waitFor(() => {
      screen.getByLabelText('Card Number')
    })

    await user.type(screen.getByLabelText('Card Number'), '4242424242424242')
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '12/25')
    await user.type(screen.getByLabelText('CVV'), '123')
    await user.type(screen.getByLabelText('Cardholder Name'), 'John Doe')
    await user.click(screen.getByRole('button', { name: 'Pay €50.00' }))

    await waitFor(() => {
      expect(screen.getByText('Payment failed. Please try again.')).toBeInTheDocument()
    })
  })

  it('should redirect if booking is already confirmed', async () => {
    ;(bookingsApi.getBooking as jest.Mock).mockResolvedValue({
      ...mockBooking,
      status: 'confirmed',
    })

    renderWithProviders()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/bookings')
    })
  })

  it('should show error if booking is expired', async () => {
    ;(bookingsApi.getBooking as jest.Mock).mockResolvedValue({
      ...mockBooking,
      expires_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    })

    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('This booking has expired')).toBeInTheDocument()
    })
  })

  it('should format card number input', async () => {
    const user = userEvent.setup()
    renderWithProviders()

    await waitFor(() => {
      screen.getByLabelText('Card Number')
    })

    const cardInput = screen.getByLabelText('Card Number') as HTMLInputElement
    await user.type(cardInput, '4242424242424242')

    // Card number should be formatted with spaces
    expect(cardInput.value).toBe('4242 4242 4242 4242')
  })

  it('should show loading state', () => {
    ;(bookingsApi.getBooking as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )
    
    renderWithProviders()
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show error state', async () => {
    ;(bookingsApi.getBooking as jest.Mock).mockRejectedValue(new Error('API Error'))
    
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText('Error loading booking')).toBeInTheDocument()
    })
  })

  it('should display additional charges for bicycle and dog', async () => {
    renderWithProviders()

    await waitFor(() => {
      expect(screen.getByText(/Includes bicycle/)).toBeInTheDocument()
    })
  })
})