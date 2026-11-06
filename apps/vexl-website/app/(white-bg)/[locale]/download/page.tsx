import {pageCopy, type PageCopy} from '@/src/copy/pageCopy'
import {pageMetadata} from '@/src/metadata'
import {resolveLocale, type LocaleParams} from '@/src/pageParams'
import {DownloadPage, euDownload} from '@/src/views/download/DownloadPage'
import {type Metadata} from 'next'
import React from 'react'

function structuredData(t: PageCopy<'download'>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: t.text('eu.meta.structuredData.name'),
    description: t.text('eu.meta.description'),
    url: '/download',
    inLanguage: 'en',
    about: {
      '@type': 'SoftwareApplication',
      name: 'Vexl',
      description: t.text('eu.meta.structuredData.appDescription'),
      operatingSystem: ['iOS', 'Android'],
      applicationCategory: 'FinanceApplication',
      offers: {'@type': 'Offer', price: '0', priceCurrency: 'USD'},
      downloadUrl: [
        'https://play.google.com/store/apps/details?id=it.vexl.next',
        'https://altstore.io/download',
        'https://github.com/vexl-it/vexl/releases/latest',
      ],
      softwareVersion: 'latest',
      featureList: t.text('eu.meta.structuredData.features').split('\n'),
    },
  }
}

export async function generateMetadata(props: LocaleParams): Promise<Metadata> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'download')
  return pageMetadata({
    locale,
    path: euDownload.path,
    title: t.text('eu.meta.title'),
    description: t.text('eu.meta.description'),
  })
}

export default async function Download(
  props: LocaleParams
): Promise<React.JSX.Element> {
  const locale = await resolveLocale(props)
  const t = pageCopy(locale, 'download')
  return (
    <DownloadPage
      locale={locale}
      variant={euDownload}
      t={t}
      jsonLd={structuredData(t)}
    />
  )
}
