import type {Metadata} from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vexl account deletion',
  description: 'Account deletion request flow for Vexl users.',
}

export default function RootLayout({
  children,
}: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/x-icon;base64,AA" />
      </head>
      <body>
        <div id="root">
          <section id="main">
            <h1>Vexl account deletion</h1>
            {children}
          </section>
          <footer id="footer">
            <a href="https://vexl.it/download">Download Vexl</a>
            <div>All rights reserved. Vexl (c) {new Date().getFullYear()}</div>
          </footer>
        </div>
      </body>
    </html>
  )
}
