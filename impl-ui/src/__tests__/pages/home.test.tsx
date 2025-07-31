import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
})

describe('Home Page', () => {
  it('should render main heading', () => {
    render(<Home />)
    expect(screen.getByText('Travel Europe by Train')).toBeInTheDocument()
  })

  it('should render subheading', () => {
    render(<Home />)
    expect(screen.getByText('Find and book train trips across Europe with ease')).toBeInTheDocument()
  })

  it('should render search trips button', () => {
    render(<Home />)
    const searchButtons = screen.getAllByRole('link', { name: /search trips/i })
    expect(searchButtons[0]).toHaveAttribute('href', '/search')
  })

  it('should render three feature cards', () => {
    render(<Home />)
    
    expect(screen.getByText('Browse Stations')).toBeInTheDocument()
    expect(screen.getByText('Plan Your Journey')).toBeInTheDocument()
    expect(screen.getByText('Manage Bookings')).toBeInTheDocument()
  })

  it('should render feature links', () => {
    render(<Home />)
    
    const stationsLink = screen.getByRole('link', { name: /view all stations/i })
    expect(stationsLink).toHaveAttribute('href', '/stations')

    const bookingsLink = screen.getByRole('link', { name: /my bookings/i })
    expect(bookingsLink).toHaveAttribute('href', '/bookings')
  })

  it('should render benefits section', () => {
    render(<Home />)
    
    expect(screen.getByText('Why Choose Train Travel?')).toBeInTheDocument()
    expect(screen.getByText('Eco-Friendly')).toBeInTheDocument()
    expect(screen.getByText('Comfortable')).toBeInTheDocument()
    expect(screen.getByText('Convenient')).toBeInTheDocument()
    expect(screen.getByText('Scenic')).toBeInTheDocument()
  })
})