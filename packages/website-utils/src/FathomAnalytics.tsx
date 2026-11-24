import Script from 'next/script'
import React from 'react'
import {type ExternalSources} from './securityHeaders'

// The EU host keeps all visitor data on Fathom's EU servers
const FATHOM_ORIGIN = 'https://cdn-eu.usefathom.com'

/**
 * What the CSP must allow: the script reports pageviews to the host it loads
 * from, with an image request and `sendBeacon`.
 */
export const fathomSources = {
  script: [FATHOM_ORIGIN],
  img: [FATHOM_ORIGIN],
  connect: [FATHOM_ORIGIN],
} satisfies ExternalSources

/**
 * Cookieless visit counting with Fathom. It reports only from the production
 * host, so local, preview and screenshot runs never count.
 */
export function FathomAnalytics({
  siteId,
  siteUrl,
}: {
  readonly siteId: string
  readonly siteUrl: string
}): React.JSX.Element {
  return (
    <Script
      src={`${FATHOM_ORIGIN}/script.js`}
      data-site={siteId}
      data-included-domains={new URL(siteUrl).hostname}
    />
  )
}
