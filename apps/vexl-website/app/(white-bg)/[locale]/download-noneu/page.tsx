import {downloadNonEu} from '@/src/i18n/download'
import {pageMetadata} from '@/src/metadata'
import {resolveLocale, type LocaleParams} from '@/src/pageParams'
import {DownloadPage} from '@/src/views/download/DownloadPage'
import {type Metadata} from 'next'
import React from 'react'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Get the Vexl app outside the EU',
  description:
    'Install Vexl on iPhone via TestFlight, or on Android from Google Play and alternative stores.',
  url: '/download-noneu',
  inLanguage: 'en',
  about: {
    '@type': 'SoftwareApplication',
    name: 'Vexl',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'iOS, Android',
    description: 'Vexl is open, private, and built for Bitcoiners.',
    offers: [
      {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock',
      },
    ],
    downloadUrl: [
      'https://testflight.apple.com/join/SuPp5FF2',
      'https://play.google.com/store/apps/details?id=it.vexl.next',
      'https://github.com/vexl-it/vexl/releases/latest',
    ],
    softwareVersion: 'beta',
    installUrl: [
      'https://apps.apple.com/us/app/testflight/id899247664?mt=8',
      'https://play.google.com/store/apps/details?id=it.vexl.next',
    ],
  },
}

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const t = downloadNonEu[locale]
  return pageMetadata({
    locale,
    path: '/download-noneu',
    title: t.metaTitle,
    description: t.metaDescription,
  })
}

export default async function DownloadNonEu(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  return (
    <DownloadPage
      locale={locale}
      path="/download-noneu"
      otherPath="/download"
      t={downloadNonEu[locale]}
      jsonLd={jsonLd}
    />
  )
}
