import {SiteDocument} from '@/src/components/SiteDocument'
import {NotFoundPage} from '@/src/views/notFound/NotFoundPage'
import React from 'react'

// Every unknown URL lands here, prerendered once, so it can't know the locale
// on the server; NotFoundPage switches to Czech in the browser under /cs.
export default function NotFound(): React.JSX.Element {
  return (
    <SiteDocument locale="en">
      <NotFoundPage />
    </SiteDocument>
  )
}
