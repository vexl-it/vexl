import Script from 'next/script'
import React from 'react'
import {type Locale} from '../i18n/locales'
import '../styles/site.css'
import '../styles/webflow.css'

/** The `<html>` shell every page shares; Webflow styles pages through the body class. */
export function SiteDocument({
  locale,
  bodyClassName,
  children,
}: {
  readonly locale: Locale
  readonly bodyClassName?: string
  readonly children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang={locale}>
      <body className={bodyClassName}>
        {children}
        <Script
          src="https://cdn.usefathom.com/script.js"
          data-site="DSCYZACS"
          data-included-domains="vexl.it"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
