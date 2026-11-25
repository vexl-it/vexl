import type React from 'react'

// The site route group and not-found each render their own <html> so Webflow's
// `.body` class applies cleanly on every route.
export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}): React.ReactNode {
  return children
}
