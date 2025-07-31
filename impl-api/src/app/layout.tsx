export const metadata = {
  title: 'Train Travel API',
  description: 'API for finding and booking train trips across Europe',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}