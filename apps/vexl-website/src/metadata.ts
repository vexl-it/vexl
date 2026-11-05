import {type Metadata} from 'next'
import {locales, localizedPath, type Locale} from './i18n/locales'

export const SITE_URL = 'https://vexl.it'
const DEFAULT_OG_IMAGE =
  '/wf/6a102b70e27ca0bedb4ec2fa_09591c4b82db84f7906d21605257042a_Vexl---OG.jpg'

/** Title, description, social cards and language alternates, as Webflow sets them. */
export function pageMetadata({
  locale,
  path,
  title,
  description,
  image = DEFAULT_OG_IMAGE,
  publishedLocales = locales,
}: {
  readonly locale: Locale
  /** Path without the locale prefix, e.g. `/faq`. */
  readonly path: string
  readonly title: string
  readonly description?: string
  readonly image?: string
  /** The locales this page exists in; only those get an hreflang link. */
  readonly publishedLocales?: readonly Locale[]
}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    icons: {
      icon: '/wf/63909e06931182a657af5b27_32.png',
      apple: '/wf/63909dd8f1ad11747ff2f157_256.png',
    },
    alternates: {
      canonical: localizedPath(locale, path),
      languages: {
        'x-default': path,
        ...Object.fromEntries(
          publishedLocales.map((other) => [other, localizedPath(other, path)])
        ),
      },
      types: {'application/rss+xml': '/post/rss.xml'},
    },
    openGraph: {title, description, images: [image], type: 'website'},
    twitter: {card: 'summary_large_image', title, description},
  }
}
