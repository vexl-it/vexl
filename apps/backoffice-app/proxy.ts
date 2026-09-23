import {Array, pipe} from 'effect'
import {type NextRequest, NextResponse} from 'next/server'
import {getBackofficeMode, getPublicHosts} from './src/server/config'

const mode = getBackofficeMode()
const hosts = getPublicHosts()

const HOMEPAGE_URL = 'https://vexl.it'

// Everything the public hosts need. In `public` mode nothing else is served.
const PUBLIC_PATH_PREFIXES = [
  '/_next/',
  '/api/health',
  '/api/tv-slideshows/',
  '/go/',
  '/tv/slideshows/',
]

const isPublicPath = (pathname: string): boolean =>
  pipe(
    PUBLIC_PATH_PREFIXES,
    Array.some((prefix) => pathname.startsWith(prefix))
  )

const SINGLE_SEGMENT_PATH = /^\/([^/]+)$/

const notFound = (): NextResponse => new NextResponse(null, {status: 404})

// `go.vexl.it/<slug>` and `slides.vexl.it/<slug>` map to the internal routes;
// the root goes to the homepage and anything else is unknown.
const servePublicHost = (
  request: NextRequest,
  internalPathPrefix: string
): NextResponse => {
  const {pathname} = request.nextUrl
  if (pathname === '/') return NextResponse.redirect(HOMEPAGE_URL)

  const match = SINGLE_SEGMENT_PATH.exec(pathname)
  if (match) {
    return NextResponse.rewrite(
      new URL(`${internalPathPrefix}${match[1]}`, request.url)
    )
  }

  return isPublicPath(pathname) ? NextResponse.next() : notFound()
}

// `nextUrl.hostname` reflects the address the server listens on, not the
// host the visitor asked for.
const requestHost = (request: NextRequest): string | undefined =>
  request.headers.get('host')?.split(':')[0]

export function proxy(request: NextRequest): NextResponse {
  const hostname = requestHost(request)
  const {pathname} = request.nextUrl

  if (hostname === hosts.shortLinks) return servePublicHost(request, '/go/')
  if (hostname === hosts.slideshows) {
    return servePublicHost(request, '/tv/slideshows/')
  }

  if (mode === 'public' && !isPublicPath(pathname)) return notFound()

  return NextResponse.next()
}
