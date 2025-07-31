# Train Travel API Implementation Plan

## Overview
This document outlines the implementation plan for building a Train Travel API system consisting of:
1. REST API implementation using Next.js and SQLite
2. UI application using Next.js and SQLite

## API Specification Summary

### Core Entities
1. **Stations** - Train stations with location and timezone info
2. **Trips** - Train trips between stations with schedules and pricing
3. **Bookings** - Passenger bookings for trips
4. **Payments** - Payment processing for bookings

### Authentication
- OAuth2 with authorization code flow
- Scopes: `read` and `write`

## Implementation Architecture

### Technology Stack
- **Framework**: Next.js (App Router)
- **Database**: SQLite with Prisma ORM
- **Authentication**: NextAuth.js for OAuth2
- **Validation**: Zod for request/response validation
- **API Documentation**: OpenAPI integration

## Project Structure

```
/
├── impl-api/                    # API Implementation
│   ├── src/
│   │   ├── app/
│   │   │   ├── api/            # API routes
│   │   │   │   ├── stations/
│   │   │   │   ├── trips/
│   │   │   │   ├── bookings/
│   │   │   │   └── auth/
│   │   ├── lib/
│   │   │   ├── db/             # Database layer
│   │   │   ├── auth/           # Authentication
│   │   │   ├── validation/     # Request validation
│   │   │   └── utils/
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   └── package.json
│
└── impl-ui/                     # UI Implementation
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/         # Auth pages
    │   │   ├── stations/       # Station management
    │   │   ├── trips/          # Trip search & booking
    │   │   ├── bookings/       # Booking management
    │   │   └── payments/       # Payment processing
    │   ├── components/
    │   │   ├── forms/
    │   │   ├── tables/
    │   │   └── ui/
    │   └── lib/
    │       ├── api/            # API client
    │       └── utils/
    └── package.json
```

## Database Schema

### Tables

```sql
-- Stations
CREATE TABLE stations (
  id TEXT PRIMARY KEY DEFAULT (uuid()),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  country_code TEXT NOT NULL,
  timezone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Trips
CREATE TABLE trips (
  id TEXT PRIMARY KEY DEFAULT (uuid()),
  origin_id TEXT NOT NULL REFERENCES stations(id),
  destination_id TEXT NOT NULL REFERENCES stations(id),
  departure_time DATETIME NOT NULL,
  arrival_time DATETIME NOT NULL,
  operator TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  bicycles_allowed BOOLEAN DEFAULT false,
  dogs_allowed BOOLEAN DEFAULT false,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (for authentication)
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (uuid()),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  oauth_provider TEXT,
  oauth_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bookings
CREATE TABLE bookings (
  id TEXT PRIMARY KEY DEFAULT (uuid()),
  trip_id TEXT NOT NULL REFERENCES trips(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  passenger_name TEXT NOT NULL,
  has_bicycle BOOLEAN DEFAULT false,
  has_dog BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
  expires_at DATETIME, -- booking expiry (1 hour from creation)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Payments
CREATE TABLE payments (
  id TEXT PRIMARY KEY DEFAULT (uuid()),
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL,
  source_type TEXT NOT NULL, -- card, bank_account
  source_details TEXT, -- JSON encrypted payment source
  status TEXT DEFAULT 'pending', -- pending, succeeded, failed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Implementation Details

### 1. Stations Endpoint (`/api/stations`)
- **GET /api/stations** - List stations with pagination and filtering
  - Query params: page, limit, coordinates, search, country
  - Response: Paginated station list with HATEOAS links
  - Cache-Control headers for performance

### 2. Trips Endpoint (`/api/trips`)
- **GET /api/trips** - Search available trips
  - Required: origin, destination, date
  - Optional: bicycles, dogs filters
  - Response: Available trips with pricing and links

### 3. Bookings Endpoints (`/api/bookings`)
- **GET /api/bookings** - List user's bookings (requires auth)
- **POST /api/bookings** - Create new booking (requires write scope)
- **GET /api/bookings/:id** - Get booking details
- **DELETE /api/bookings/:id** - Cancel booking

### 4. Payments Endpoint (`/api/bookings/:id/payment`)
- **POST /api/bookings/:id/payment** - Process payment
  - Supports card and bank account payments
  - PCI compliance considerations (tokenization)

### 5. Authentication (`/api/auth`)
- OAuth2 implementation with NextAuth.js
- Authorization URL: `/api/auth/authorize`
- Token URL: `/api/auth/token`
- Callback URL: `/api/auth/callback`

## UI Implementation Details

### Pages and Features

1. **Home Page**
   - Trip search form
   - Popular destinations
   - Quick station finder

2. **Stations Page** (`/stations`)
   - Station listing with search
   - Filter by country
   - Map view integration

3. **Trip Search** (`/trips`)
   - Search form: origin, destination, date
   - Filter options: bicycles, dogs
   - Results with pricing and availability
   - Direct booking CTA

4. **Booking Flow** (`/bookings/new`)
   - Trip selection confirmation
   - Passenger details form
   - Extras selection (bicycle, dog)
   - Review and confirm

5. **My Bookings** (`/bookings`)
   - List of user's bookings
   - Booking status indicators
   - Cancel booking option
   - Payment status

6. **Payment Page** (`/payments`)
   - Secure payment form
   - Card/Bank account options
   - Payment confirmation
   - Booking completion

### UI Components

1. **Common Components**
   - Navigation header with auth status
   - Station autocomplete
   - Date/time picker
   - Pagination controls
   - Loading states
   - Error boundaries

2. **Forms**
   - Trip search form
   - Booking form
   - Payment form with validation
   - Login/OAuth forms

3. **Data Display**
   - Station cards
   - Trip results table
   - Booking summary cards
   - Payment history

## Implementation Phases

### Phase 1: Core API Setup (Week 1)
1. Initialize Next.js projects for API and UI
2. Set up SQLite database with Prisma
3. Implement authentication with NextAuth.js
4. Create database schema and migrations
5. Set up API route structure

### Phase 2: API Endpoints (Week 2)
1. Implement Stations endpoints
2. Implement Trips endpoints
3. Implement Bookings endpoints
4. Add request validation with Zod
5. Add error handling and responses

### Phase 3: Payment & Security (Week 3)
1. Implement Payment endpoint
2. Add payment processing logic (mock)
3. Implement rate limiting
4. Add security headers
5. Complete OAuth2 flow

### Phase 4: UI Foundation (Week 4)
1. Set up UI project structure
2. Implement authentication flow
3. Create base layout and navigation
4. Set up API client with fetch
5. Add common UI components

### Phase 5: Core UI Features (Week 5)
1. Implement station listing and search
2. Create trip search functionality
3. Build booking creation flow
4. Add user bookings management
5. Implement payment UI

### Phase 6: Polish & Testing (Week 6)
1. Add loading and error states
2. Implement responsive design
3. Add E2E tests
4. Performance optimization
5. Documentation

## Key Considerations

### Security
- Implement proper OAuth2 flow
- Secure payment data handling
- Input validation and sanitization
- Rate limiting and DDoS protection
- CORS configuration

### Performance
- Database indexing on search fields
- Response caching where appropriate
- Pagination for large datasets
- Optimistic UI updates

### User Experience
- Intuitive booking flow
- Clear error messages
- Booking expiry warnings
- Mobile-responsive design
- Accessibility compliance

### Development Practices
- TypeScript for type safety
- API versioning strategy
- Comprehensive error logging
- Environment configuration
- CI/CD pipeline setup

## Testing Strategy

1. **Unit Tests**
   - API endpoint logic
   - Database operations
   - Validation functions

2. **Integration Tests**
   - API endpoint responses
   - Database transactions
   - Authentication flow

3. **E2E Tests**
   - Complete booking flow
   - Payment processing
   - Search functionality

## Deployment Considerations

1. **Environment Variables**
   - Database connection
   - OAuth credentials
   - API URLs
   - Secret keys

2. **Database**
   - SQLite file location
   - Backup strategy
   - Migration management

3. **Monitoring**
   - API performance metrics
   - Error tracking
   - User analytics