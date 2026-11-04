import {type Metadata} from 'next'
import {locales, localizedPath, messages, type Locale} from './i18n/locales'

export const SITE_URL = 'https://vexl.it'

type PageKey = keyof (typeof messages)['en']['meta']

export function pageMetadata(
  locale: Locale,
  page: PageKey,
  path: string,
  overrides: {
    readonly title?: string
    readonly description?: string
    readonly image?: string
  } = {}
): Metadata {
  const meta = messages[locale].meta[page]
  const title = overrides.title ?? meta.title
  const description = overrides.description ?? meta.description
  const images = [overrides.image ?? '/images/og-image.webp']
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: localizedPath(locale, path),
      languages: Object.fromEntries(
        locales.map((other) => [other, localizedPath(other, path)])
      ),
    },
    openGraph: {title, description, images, type: 'website', siteName: 'Vexl'},
    twitter: {card: 'summary_large_image', title, description, images},
  }
}
