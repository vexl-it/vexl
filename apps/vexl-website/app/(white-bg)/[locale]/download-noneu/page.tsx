import {pageCopy, type PageCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {resolveLocale, type LocaleParams} from '@/src/pageParams'
import {DownloadPage, nonEuDownload} from '@/src/views/download/DownloadPage'
import {type Metadata} from 'next'
import React from 'react'

function structuredData(t: PageCopy<'download'>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t.text('nonEu.meta.structuredData.name'),
    description: t.text('nonEu.meta.description'),
    url: '/download-noneu',
    inLanguage: 'en',
    about: {
      '@type': 'SoftwareApplication',
      name: 'Vexl',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'iOS, Android',
      description: t.text('nonEu.meta.structuredData.appDescription'),
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
}

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'download')
  return pageMetadata({
    locale,
    path: nonEuDownload.path,
    title: t.text('nonEu.meta.title'),
    description: t.text('nonEu.meta.description'),
  })
}

export default async function DownloadNonEu(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'download')
  return (
    <DownloadPage
      locale={locale}
      variant={nonEuDownload}
      t={t}
      jsonLd={structuredData(t)}
    />
  )
}
