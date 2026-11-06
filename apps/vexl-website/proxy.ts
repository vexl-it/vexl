import {Option} from 'effect'
import {NextResponse, type NextRequest} from 'next/server'
import {blogPageCount, blogPosts, findBlogPost} from './src/content/blog'
import {contentSecurityPolicies} from './src/contentSecurityPolicy'
import {type Locale} from './src/i18n/locales'
import {parseListPage} from './src/pageParams'
import {loadEvents, pastEventsPageCount} from './src/views/community/events'

// Not '/404': Vercel serves a rewrite to the 404 page with status 200
const UNMATCHED_PATH = '/_unmatched'
const CONTENT_PATH = /^(?:\/(cs))?\/(post|blog\/page|community\/page)\/([^/]+)$/

async function contentExists(pathname: string): Promise<boolean> {
  const [, cs, kind, param = ''] = CONTENT_PATH.exec(pathname) ?? []
  if (kind === undefined) return true
  const locale: Locale = cs === undefined ? 'en' : 'cs'
  if (kind === 'post' && param === 'rss.xml') return locale === 'en'
  if (kind === 'post')
    return Option.isSome(findBlogPost(await blogPosts(locale), param))
  if (kind === 'blog/page')
    return Option.isSome(
      parseListPage(param, blogPageCount(await blogPosts(locale)))
    )
  return Option.isSome(
    parseListPage(param, pastEventsPageCount((await loadEvents()).past))
  )
}

/**
 * Every response the proxy sees gets the security headers (config redirects
 * run before it), and every page a fresh CSP nonce, which is also why every
 * page renders per request.
 *
 * Next only sends real 404 HTML for URLs no route matches; a request-time
 * page that calls notFound() gets a JS-only shell. So unknown posts and page
 * numbers are rewritten to an unmatched URL before they reach their route.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const csp = contentSecurityPolicies(btoa(crypto.randomUUID()))
  const headers = new Headers(request.headers)
  headers.set('Content-Security-Policy', csp.withNonce)
  const forwarded = {request: {headers}}
  const exists = await contentExists(request.nextUrl.pathname).catch(
    // Content-service is down: let the page fail and report it
    () => true
  )
  const response = exists
    ? NextResponse.next(forwarded)
    : NextResponse.rewrite(new URL(UNMATCHED_PATH, request.url), forwarded)
  response.headers.set('Content-Security-Policy', csp.enforced)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}
