import {Option} from 'effect'
import {NextResponse, type NextRequest} from 'next/server'
import {blogPageCount, blogPosts, findBlogPost} from './src/content/blog'
import {type Locale} from './src/i18n/locales'
import {parseListPage} from './src/pageParams'
import {loadEvents, pastEventsPageCount} from './src/views/community/events'

// Not '/404': Vercel serves a rewrite to the 404 page with status 200
const UNMATCHED_PATH = '/_unmatched'
const CONTENT_PATH = /^(?:\/(cs))?\/(post|blog\/page|community\/page)\/([^/]+)$/

async function contentExists(pathname: string): Promise<boolean> {
  const [, cs, kind, param = ''] = CONTENT_PATH.exec(pathname) ?? []
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
 * Next only sends real 404 HTML for URLs no route matches; a request-time
 * page that calls notFound() gets a JS-only shell. So unknown posts and page
 * numbers are rewritten to an unmatched URL before they reach their route.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const exists = await contentExists(request.nextUrl.pathname).catch(
    // Content-service is down: let the page fail and report it
    () => true
  )
  return exists
    ? NextResponse.next()
    : NextResponse.rewrite(new URL(UNMATCHED_PATH, request.url))
}

export const config = {
  matcher: [
    '/post/:slug',
    '/cs/post/:slug',
    '/blog/page/:page',
    '/cs/blog/page/:page',
    '/community/page/:page',
    '/cs/community/page/:page',
  ],
}
