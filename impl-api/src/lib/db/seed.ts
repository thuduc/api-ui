import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create stations
  const stations = await Promise.all([
    prisma.station.create({
      data: {
        id: 'efdbb9d1-02c2-4bc3-afb7-6788d8782b1e',
        name: 'Berlin Hauptbahnhof',
        address: 'Invalidenstraße 10557 Berlin, Germany',
        countryCode: 'DE',
        timezone: 'Europe/Berlin',
      },
    }),
    prisma.station.create({
      data: {
        id: 'b2e783e1-c824-4d63-b37a-d8d698862f1d',
        name: 'Paris Gare du Nord',
        address: '18 Rue de Dunkerque 75010 Paris, France',
        countryCode: 'FR',
        timezone: 'Europe/Paris',
      },
    }),
    prisma.station.create({
      data: {
        id: uuidv4(),
        name: 'Amsterdam Centraal',
        address: 'Stationsplein 1012 AB Amsterdam, Netherlands',
        countryCode: 'NL',
        timezone: 'Europe/Amsterdam',
      },
    }),
    prisma.station.create({
      data: {
        id: uuidv4(),
        name: 'Brussels Central',
        address: 'Carrefour de l\'Europe 1000 Brussels, Belgium',
        countryCode: 'BE',
        timezone: 'Europe/Brussels',
      },
    }),
  ])

  console.log(`Created ${stations.length} stations`)

  // Create trips
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const trips = []
  for (let hour = 6; hour <= 20; hour += 2) {
    const departureTime = new Date(tomorrow)
    departureTime.setHours(hour, 0, 0, 0)
    
    const arrivalTime = new Date(departureTime)
    arrivalTime.setHours(hour + 6, 0, 0, 0)

    trips.push(
      prisma.trip.create({
        data: {
          id: uuidv4(),
          originId: stations[0].id, // Berlin
          destinationId: stations[1].id, // Paris
          departureTime,
          arrivalTime,
          operator: hour % 4 === 0 ? 'Deutsche Bahn' : 'SNCF',
          price: 50 + (hour * 2),
          bicyclesAllowed: hour % 3 !== 0,
          dogsAllowed: true,
        },
      })
    )

    // Return trip
    const returnDeparture = new Date(departureTime)
    returnDeparture.setHours(hour + 1, 30, 0, 0)
    
    const returnArrival = new Date(returnDeparture)
    returnArrival.setHours(hour + 7, 30, 0, 0)

    trips.push(
      prisma.trip.create({
        data: {
          id: uuidv4(),
          originId: stations[1].id, // Paris
          destinationId: stations[0].id, // Berlin
          departureTime: returnDeparture,
          arrivalTime: returnArrival,
          operator: hour % 4 === 0 ? 'SNCF' : 'Deutsche Bahn',
          price: 50 + (hour * 2),
          bicyclesAllowed: hour % 3 !== 0,
          dogsAllowed: hour % 2 === 0,
        },
      })
    )
  }

  const createdTrips = await Promise.all(trips)
  console.log(`Created ${createdTrips.length} trips`)

  // Create a test user
  const testUser = await prisma.user.create({
    data: {
      id: 'test-user-1',
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  console.log('Created test user:', testUser.email)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })