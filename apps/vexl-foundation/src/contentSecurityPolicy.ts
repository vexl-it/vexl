// React uses eval in dev to rebuild server error stacks
const devEval = process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''

const policy = (scriptSources: string): string =>
  [
    "default-src 'self'",
    `script-src ${scriptSources}${devEval}`,
    // React style props and Next.js runtime styles
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self'",
    // webflow.css inlines its icon font as a data URL
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

/**
 * The site only talks to our own origin. Browsers enforce both policies:
 * the nonce one only lets inline scripts with the nonce run, and the static
 * one only lets scripts load from our origin. A nonce alone would allow any
 * origin, because next/script puts it on every `<Script>`.
 */
export function contentSecurityPolicies(nonce: string): {
  /** What Next reads the nonce from to put it on its inline scripts. */
  readonly withNonce: string
  /** Both policies in one header value. */
  readonly enforced: string
} {
  const withNonce = policy(`'self' 'nonce-${nonce}'`)
  return {
    withNonce,
    enforced: `${withNonce}, ${policy("'self' 'unsafe-inline'")}`,
  }
}
