import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Header } from '@/components/layout/header'

jest.mock('next-auth/react')

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>
const mockSignIn = signIn as jest.MockedFunction<typeof signIn>
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render site title', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    expect(screen.getByText('Train Travel')).toBeInTheDocument()
  })

  it('should render navigation links', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    expect(screen.getByRole('link', { name: 'Stations' })).toHaveAttribute('href', '/stations')
    expect(screen.getByRole('link', { name: 'Search Trips' })).toHaveAttribute('href', '/search')
  })

  it('should show sign in button when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument()
  })

  it('should call signIn when sign in button is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    const user = userEvent.setup()
    render(<Header />)
    
    await user.click(screen.getByRole('button', { name: 'Sign In' }))
    
    expect(mockSignIn).toHaveBeenCalled()
  })

  it('should show user email and sign out button when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument()
  })

  it('should show My Bookings link when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    expect(screen.getByRole('link', { name: 'My Bookings' })).toHaveAttribute('href', '/bookings')
  })

  it('should not show My Bookings link when not authenticated', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    expect(screen.queryByRole('link', { name: 'My Bookings' })).not.toBeInTheDocument()
  })

  it('should call signOut when sign out button is clicked', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    const user = userEvent.setup()
    render(<Header />)
    
    await user.click(screen.getByRole('button', { name: 'Sign Out' }))
    
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('should show loading state', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'loading',
      update: jest.fn(),
    })

    render(<Header />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign In' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sign Out' })).not.toBeInTheDocument()
  })

  it('should have correct link structure', () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { email: 'test@example.com' },
        expires: '2024-12-31',
      },
      status: 'authenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    const homeLink = screen.getByRole('link', { name: 'Train Travel' })
    expect(homeLink).toHaveAttribute('href', '/')
    
    const stationsLink = screen.getByRole('link', { name: 'Stations' })
    expect(stationsLink).toHaveAttribute('href', '/stations')
    
    const searchLink = screen.getByRole('link', { name: 'Search Trips' })
    expect(searchLink).toHaveAttribute('href', '/search')
    
    const bookingsLink = screen.getByRole('link', { name: 'My Bookings' })
    expect(bookingsLink).toHaveAttribute('href', '/bookings')
  })

  it('should have responsive navigation with hidden md:flex class', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    const navContainer = screen.getByRole('link', { name: 'Stations' }).parentElement
    expect(navContainer).toHaveClass('hidden', 'md:flex')
  })

  it('should apply correct styling classes', () => {
    mockUseSession.mockReturnValue({
      data: null,
      status: 'unauthenticated',
      update: jest.fn(),
    })

    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('bg-white', 'shadow-sm')
    
    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('container', 'mx-auto', 'px-4', 'py-4')
  })
})