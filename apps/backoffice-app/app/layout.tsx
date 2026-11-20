import {getPublicHosts} from '@/src/server/config'
import {PublicHostsProvider} from '@/src/services/publicHosts'
import type {Metadata} from 'next'
import localFont from 'next/font/local'
import './globals.css'

const satoshi = localFont({
  src: [
    {path: './fonts/tt_satoshi_400.otf', weight: '400'},
    {path: './fonts/tt_satoshi_500.otf', weight: '500'},
    {path: './fonts/tt_satoshi_600.otf', weight: '600'},
    {path: './fonts/tt_satoshi_700.otf', weight: '700'},
  ],
  variable: '--font-satoshi',
})

const monument = localFont({
  src: [
    {path: './fonts/pp_monument_400.ttf', weight: '400'},
    {path: './fonts/pp_monument_700.ttf', weight: '700'},
  ],
  variable: '--font-monument',
})

export const metadata: Metadata = {
  title: 'Vexl Backoffice',
  description: 'Backoffice application for managing Vexl clubs',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${satoshi.variable} ${monument.variable}`}>
      <body className="bg-canvas font-sans font-medium text-ink antialiased">
        <PublicHostsProvider hosts={getPublicHosts()}>
          {children}
        </PublicHostsProvider>
      </body>
    </html>
  )
}
