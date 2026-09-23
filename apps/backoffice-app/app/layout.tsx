import {getPublicHosts} from '@/src/server/config'
import {PublicHostsProvider} from '@/src/services/publicHosts'
import type {Metadata} from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vexl Backoffice',
  description: 'Backoffice application for managing Vexl clubs',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <PublicHostsProvider hosts={getPublicHosts()}>
          {children}
        </PublicHostsProvider>
      </body>
    </html>
  )
}
