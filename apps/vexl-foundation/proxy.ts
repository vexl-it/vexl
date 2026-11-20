import {NextResponse, type NextRequest} from 'next/server'
import {contentSecurityPolicies} from './src/contentSecurityPolicy'

/**
 * Every response the proxy sees gets the security headers, and every page a
 * fresh CSP nonce, which is also why every page renders per request.
 */
export function proxy(request: NextRequest): NextResponse {
  const csp = contentSecurityPolicies(btoa(crypto.randomUUID()))
  const headers = new Headers(request.headers)
  headers.set('Content-Security-Policy', csp.withNonce)
  const response = NextResponse.next({request: {headers}})
  response.headers.set('Content-Security-Policy', csp.enforced)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}
