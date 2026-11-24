import {type NextRequest, type NextResponse} from 'next/server'

/** Origins a site needs beyond its own. */
export interface ExternalSources {
  readonly img?: readonly string[]
  readonly frame?: readonly string[]
}

// React uses eval in dev to rebuild server error stacks
const devEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''

const policy = (scriptSources: string, external: ExternalSources): string =>
  [
    "default-src 'self'",
    `script-src ${scriptSources}${devEval}`,
    // React style props, Next.js runtime styles and Webflow embeds
    "style-src 'self' 'unsafe-inline'",
    ["img-src 'self'", ...(external.img ?? [])].join(' '),
    // webflow.css inlines its icon font as a data URL
    "font-src 'self' data:",
    ...(external.frame ? [['frame-src', ...external.frame].join(' ')] : []),
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

/**
 * The site only talks to our own origins. Browsers enforce both policies:
 * the nonce one only lets inline scripts with the nonce run, and the static
 * one only lets scripts load from our origin. A nonce alone would allow any
 * origin, because next/script puts it on every `<Script>`.
 */
export function contentSecurityPolicies(
  nonce: string,
  external: ExternalSources = {}
): {
  /** What Next reads the nonce from to put it on its inline scripts. */
  readonly withNonce: string
  /** Both policies in one header value. */
  readonly enforced: string
} {
  const withNonce = policy(`'self' 'nonce-${nonce}'`, external)
  return {
    withNonce,
    enforced: `${withNonce}, ${policy("'self' 'unsafe-inline'", external)}`,
  }
}

/**
 * The proxy's response with the security headers, and a fresh CSP nonce that
 * Next puts on the page's scripts, which is also why every page renders per
 * request. `respond` passes the request init on to `NextResponse`.
 */
export function withSecurityHeaders(
  request: NextRequest,
  external: ExternalSources,
  respond: (init: {
    readonly request: {readonly headers: Headers}
  }) => NextResponse
): NextResponse {
  const csp = contentSecurityPolicies(btoa(crypto.randomUUID()), external)
  const headers = new Headers(request.headers)
  headers.set('Content-Security-Policy', csp.withNonce)
  const response = respond({request: {headers}})
  response.headers.set('Content-Security-Policy', csp.enforced)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}
