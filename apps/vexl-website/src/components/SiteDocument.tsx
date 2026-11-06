import Script from 'next/script'
import React from 'react'
import {copyPages} from '../copy/copyFiles'
import {type Locale} from '../i18n/locales'
import '../styles/site.css'
import '../styles/webflow.css'
import {AnchorScroll} from './AnchorScroll'

/**
 * The copy editor under `next dev`. The import sits in a branch the build
 * removes, so production bundles contain neither the editor nor its save
 * action.
 */
async function DevCopyEditor(): Promise<React.ReactNode> {
  if (process.env.NODE_ENV === 'development') {
    const {CopyEditor} = await import('../copyEditor/CopyEditor')
    return <CopyEditor copy={copyPages} />
  }
  return null
}

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
        <AnchorScroll />
        <DevCopyEditor />
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
