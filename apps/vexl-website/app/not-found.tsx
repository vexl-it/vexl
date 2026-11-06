import {SiteDocument} from '@/src/components/SiteDocument'
import {pageCopy} from '@/src/copy/pageCopy'
import {type Locale} from '@/src/i18n/locales'
import {
  type NotFoundCopy,
  NotFoundPage,
} from '@/src/views/notFound/NotFoundPage'
import React from 'react'

function notFoundCopy(locale: Locale): NotFoundCopy {
  const t = pageCopy(locale, 'not-found')
  return {
    title: t.text('meta.title'),
    description: t.text('meta.description'),
    heading: t('heading'),
    subtitle: t('subtitle'),
    home: t('home'),
  }
}

// Every unknown URL lands here, prerendered once, so it can't know the locale
// on the server; NotFoundPage switches to Czech in the browser under /cs.
export default function NotFound(): React.JSX.Element {
  return (
    <SiteDocument locale="en">
      <NotFoundPage copy={{en: notFoundCopy('en'), cs: notFoundCopy('cs')}} />
    </SiteDocument>
  )
}
