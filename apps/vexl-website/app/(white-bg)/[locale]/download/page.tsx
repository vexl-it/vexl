import {download} from '@/src/i18n/download'
import {pageMetadata} from '@/src/metadata'
import {resolveLocale, type LocaleParams} from '@/src/pageParams'
import {DownloadPage} from '@/src/views/download/DownloadPage'
import {type Metadata} from 'next'
import React from 'react'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Download Vexl',
  description:
    'Get Vexl on your phone. One tap on Android, three steps on iPhone. No KYC, no accounts, no App Store gatekeepers.',
  url: '/download',
  inLanguage: 'en',
  about: {
    '@type': 'SoftwareApplication',
    name: 'Vexl',
    description: 'Open, private Bitcoin trading app built for Bitcoiners',
    operatingSystem: ['iOS', 'Android'],
    applicationCategory: 'FinanceApplication',
    offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
    downloadUrl: [
      'https://play.google.com/store/apps/details?id=it.vexl.next',
      'https://altstore.io/download',
      'https://github.com/vexl-it/vexl/releases/latest',
    ],
    softwareVersion: 'latest',
    featureList: [
      'No KYC required',
      'No accounts needed',
      'Private Bitcoin trading',
      'Available outside App Store via AltStore',
      'Open source',
    ],
  },
}

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const t = download[locale]
  return pageMetadata({
    locale,
    path: '/download',
    title: t.metaTitle,
    description: t.metaDescription,
  })
}

export default async function Download(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  return (
    <DownloadPage
      locale={locale}
      path="/download"
      otherPath="/download-noneu"
      t={download[locale]}
      jsonLd={jsonLd}
    />
  )
}
