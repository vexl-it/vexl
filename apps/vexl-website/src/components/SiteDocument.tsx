import {FathomAnalytics} from '@vexl-next/website-utils/src/FathomAnalytics'
import {connection} from 'next/server'
import React from 'react'
import {copyPages} from '../copy/copyFiles'
import {type Locale} from '../i18n/locales'
import {SITE_URL} from '../metadata'
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
    const [{CopyEditor}, {saveCopy}] = await Promise.all([
      import('@vexl-next/website-utils/src/copyEditor/CopyEditor'),
      import('../copyEditor/saveCopy'),
    ])
    return (
      <CopyEditor
        copy={copyPages}
        save={saveCopy}
        storageKey="vexl-website-copy-editor"
      />
    )
  }
  return null
}

/**
 * The `<html>` shell every page shares; Webflow styles pages through the body
 * class. Pages render per request so their scripts carry the request's CSP
 * nonce (see `proxy.ts`).
 */
export async function SiteDocument({
  locale,
  bodyClassName,
  children,
}: {
  readonly locale: Locale
  readonly bodyClassName?: string
  readonly children: React.ReactNode
}): Promise<React.JSX.Element> {
  await connection()
  return (
    <html lang={locale}>
      <body className={bodyClassName}>
        {children}
        <AnchorScroll />
        <DevCopyEditor />
        <FathomAnalytics siteId="ZOUNBVYL" siteUrl={SITE_URL} />
      </body>
    </html>
  )
}
