import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  manifest: '/manifest.json',
  title: 'P2P Bitcoin Trading Calculator | Vexl',
  description:
    'Calculate Bitcoin trades with live prices, premium/discount adjustments, and multiple currencies. Free P2P trading calculator by Vexl.',
  keywords: [
    'Bitcoin calculator',
    'BTC calculator',
    'P2P trading calculator',
    'Bitcoin trade calculator',
    'crypto premium calculator',
    'Bitcoin price converter',
    'satoshi calculator',
  ],
  authors: [{ name: 'Vexl', url: 'https://vexl.it' }],
  creator: 'Vexl',
  publisher: 'Vexl',
  metadataBase: new URL('https://trading-calculator.vexl.it'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trading-calculator.vexl.it',
    siteName: 'Vexl Trading Calculator',
    title: 'P2P Bitcoin Trading Calculator | Vexl',
    description:
      'Calculate Bitcoin trades with live prices, premium/discount adjustments, and multiple currencies.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vexl Trading Calculator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'P2P Bitcoin Trading Calculator | Vexl',
    description:
      'Calculate Bitcoin trades with live prices, premium/discount adjustments, and multiple currencies.',
    images: ['/og-image.png'],
    creator: '@vaborator',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Vexl Calculator',
  },
}

export const viewport: Viewport = {
  themeColor: '#101010',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Vexl Trading Calculator',
              description:
                'Calculate Bitcoin trades with live prices, premium/discount adjustments, and multiple currencies.',
              url: 'https://trading-calculator.vexl.it',
              applicationCategory: 'FinanceApplication',
              operatingSystem: 'Any',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              creator: {
                '@type': 'Organization',
                name: 'Vexl',
                url: 'https://vexl.it',
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Vexl',
                  item: 'https://vexl.it',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Trading Calculator',
                  item: 'https://trading-calculator.vexl.it',
                },
              ],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
