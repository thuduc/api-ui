export default function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Train Travel API</h1>
      <p>API for finding and booking train trips across Europe.</p>
      
      <h2>Available Endpoints:</h2>
      <ul>
        <li>GET /api/stations - List train stations</li>
        <li>GET /api/trips - Search for trips</li>
        <li>GET /api/bookings - List bookings (auth required)</li>
        <li>POST /api/bookings - Create booking (auth required)</li>
        <li>GET /api/bookings/:id - Get booking details (auth required)</li>
        <li>DELETE /api/bookings/:id - Cancel booking (auth required)</li>
        <li>POST /api/bookings/:id/payment - Process payment (auth required)</li>
      </ul>

      <h2>Authentication:</h2>
      <p>This API uses OAuth2 authentication. Visit /api/auth/signin to authenticate.</p>
    </div>
  )
}