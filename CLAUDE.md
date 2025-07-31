# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Train Travel API system with two main components:
- **impl-api**: REST API implementation using Next.js 14 App Router and SQLite
- **impl-ui**: UI application using Next.js 14 with TypeScript

Both applications implement the functionality defined in `openapi.json` which specifies OAuth2 authentication, station management, trip search, booking creation, and payment processing.

## Common Commands

### API Development (impl-api)

```bash
cd impl-api

# Development
npm run dev              # Start dev server on http://localhost:3000
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes to database
npm run db:migrate       # Create and apply migrations
npm run db:seed          # Seed database with test data
npm run db:studio        # Open Prisma Studio GUI

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm test -- path/to/test # Run specific test file

# Code quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking
```

### UI Development (impl-ui)

```bash
cd impl-ui

# Development
npm run dev              # Start dev server on http://localhost:3001
npm run build            # Build for production
npm run start            # Start production server on port 3001

# Testing
npm test                 # Run all tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage
npm test -- path/to/test # Run specific test file

# Code quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking
```

## Architecture Overview

### API Architecture (impl-api)

The API follows Next.js 14 App Router conventions with RESTful endpoints:

- **Database Layer**: SQLite with Prisma ORM
  - Schema defined in `prisma/schema.prisma`
  - Models: Station, Trip, User, Booking, Payment
  - All IDs use UUID format

- **API Routes** (`src/app/api/`):
  - `/stations` - Station CRUD with pagination and search
  - `/trips` - Trip search with filtering (origin, destination, date, bicycles, dogs)
  - `/bookings` - Booking creation and management with 1-hour expiry
  - `/bookings/[id]/payment` - Payment processing
  - `/auth` - NextAuth.js OAuth2 implementation

- **Key Patterns**:
  - All responses follow HATEOAS with `_links` for navigation
  - Error responses use RFC 7807 Problem Details format
  - Authentication uses NextAuth.js with JWT tokens
  - Request validation with Zod schemas (`src/lib/validation/schemas.ts`)

### UI Architecture (impl-ui)

The UI is a Next.js 14 application with TypeScript:

- **API Client** (`src/lib/api/client.ts`):
  - Centralized API communication with automatic auth token injection
  - Error handling with ApiError class
  - Supports all HTTP methods with proper typing
  - Filters out empty string parameters to avoid validation errors

- **State Management**:
  - TanStack Query for server state
  - React Hook Form with Zod validation for forms
  - NextAuth.js for authentication state

- **Key Components**:
  - `StationSelect` - Reusable station selector with search
  - `TripCard` - Trip display with booking action
  - Layout with authentication-aware header

- **Pages Structure**:
  - `/` - Home page
  - `/stations` - Station listing
  - `/search` - Trip search
  - `/booking/new` - Create booking
  - `/booking/[id]/payment` - Payment processing
  - `/bookings` - User's bookings

## Testing Strategy

Both projects use Jest with React Testing Library:

- **API Tests**: Focus on endpoint behavior, validation, and error handling
- **UI Tests**: Component rendering, user interactions, and API integration
- Tests use UUID format for all IDs to match schema requirements
- Mock NextAuth sessions for authenticated routes

## Development Setup

1. **Install Dependencies**:
   ```bash
   # Install API dependencies
   cd impl-api
   npm install
   
   # Install UI dependencies
   cd ../impl-ui
   npm install
   ```

2. **Environment Variables**:
   - **impl-api**: Copy `.env.example` to `.env`
     - Set `DATABASE_URL` (defaults to `file:./dev.db`)
     - Configure NextAuth secrets and OAuth providers
   - **impl-ui**: Create `.env.local`
     - Set `NEXTAUTH_URL=http://localhost:3001`
     - Set `NEXTAUTH_SECRET` (generate with `npx auth secret`)
     - Set `NEXT_PUBLIC_API_URL=http://localhost:3000`
     - Configure OAuth provider credentials

3. **Database Setup**:
   ```bash
   cd impl-api
   npm run db:push    # Create database schema
   npm run db:seed    # Optional: add test data
   ```

4. **Running Both Applications**:
   ```bash
   # Terminal 1 - Start API server
   cd impl-api
   npm run dev    # Runs on http://localhost:3000
   
   # Terminal 2 - Start UI server
   cd impl-ui
   npm run dev    # Runs on http://localhost:3001
   ```
   
   - API runs on port 3000
   - UI runs on port 3001
   - UI expects API to be available at http://localhost:3000

## Key Implementation Details

- **Authentication**: All booking and payment endpoints require authentication
- **Booking Expiry**: Bookings expire after 1 hour if not paid
- **Payment**: Supports card payments with validation
- **Station Search**: Case-insensitive search by name or country
- **Trip Filtering**: Supports date, bicycle, and dog filters
- **Error Handling**: Consistent RFC 7807 problem details across API
- **CORS Configuration**: API configured to accept requests from UI at localhost:3001

## Common Issues and Solutions

### UI Build Issues

1. **NextAuth Route Handler**: In Next.js 13+ App Router, `authOptions` must be in a separate file (`src/lib/auth.ts`), not in the route handler
2. **useSearchParams Suspense**: Pages using `useSearchParams()` must be wrapped in a Suspense boundary
3. **TypeScript Session Types**: Extended NextAuth types are defined in `src/types/next-auth.d.ts`

### API Issues

1. **CORS Errors**: Ensure API server is restarted after modifying `next.config.js` CORS headers
2. **Validation Errors**: Empty strings in query parameters will fail validation - the UI client filters these out
3. **Database Connection**: Ensure SQLite database file exists and has proper permissions

### Environment Issues

1. **NextAuth Errors**: Ensure `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set in `.env.local`
2. **API Connection**: Verify API is running on port 3000 before starting UI
3. **OAuth Providers**: Replace placeholder OAuth credentials with actual values for authentication to work