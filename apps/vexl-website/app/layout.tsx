import type React from 'react'

// Each route group renders its own <html>; this only gives 404s a root.
export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}): React.ReactNode {
  return children
}
