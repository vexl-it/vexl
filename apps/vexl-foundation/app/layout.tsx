import type React from 'react'

// The home route group and not-found each render their own <html> so Webflow's
// `.body` class applies to the homepage without affecting the 404 page.
export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}): React.ReactNode {
  return children
}
