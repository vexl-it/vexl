import {FathomAnalytics} from '@vexl-next/website-utils/src/FathomAnalytics'
import {Record} from 'effect'
import {connection} from 'next/server'
import React from 'react'
import {copyPages} from '../copy/copyFiles'
import {SITE_URL} from '../metadata'
import '../styles/site.css'
import '../styles/webflow.css'

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
        copy={Record.map(copyPages, (values) => ({en: values}))}
        save={saveCopy}
        storageKey="vexl-foundation-copy-editor"
      />
    )
  }
  return null
}

/**
 * The `<html>` shell every page shares; Webflow styles the homepage via
 * `.body` and leaves the 404 body unclassed. Pages render per request so
 * their scripts carry the request's CSP nonce (see `proxy.ts`).
 */
export async function SiteDocument({
  bodyClassName,
  children,
}: {
  readonly bodyClassName?: string
  readonly children: React.ReactNode
}): Promise<React.JSX.Element> {
  await connection()
  return (
    <html lang="en">
      <body className={bodyClassName}>
        {children}
        <DevCopyEditor />
        <FathomAnalytics siteId="RPHOEAFL" siteUrl={SITE_URL} />
      </body>
    </html>
  )
}
