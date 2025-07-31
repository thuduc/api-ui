import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Travel Europe by Train
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Find and book train trips across Europe with ease
        </p>
        <Link href="/search">
          <Button size="lg">
            Search Trips
          </Button>
        </Link>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Browse Stations</CardTitle>
            <CardDescription>
              Explore train stations across Europe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/stations">
              <Button variant="outline" className="w-full">
                View All Stations
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan Your Journey</CardTitle>
            <CardDescription>
              Search for the perfect train connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/search">
              <Button variant="outline" className="w-full">
                Search Trips
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manage Bookings</CardTitle>
            <CardDescription>
              View and manage your train bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/bookings">
              <Button variant="outline" className="w-full">
                My Bookings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="bg-blue-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Why Choose Train Travel?
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2">Eco-Friendly</h3>
            <p className="text-gray-600">
              Trains are one of the most environmentally friendly ways to travel across Europe.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Comfortable</h3>
            <p className="text-gray-600">
              Enjoy spacious seats, walk around freely, and arrive refreshed at your destination.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Convenient</h3>
            <p className="text-gray-600">
              City center to city center connections with no lengthy check-in procedures.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Scenic</h3>
            <p className="text-gray-600">
              Experience beautiful landscapes and countryside views throughout your journey.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}