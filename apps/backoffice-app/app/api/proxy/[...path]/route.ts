import {accessError} from '@/src/server/access/errors'
import {requireSessionSection} from '@/src/server/access/session'
import {adminTokenConfig} from '@/src/server/config'
import {handleAccessRequest} from '@/src/server/http'
import {type BackofficeSection} from '@/src/services/access/domain'
import {Array, Effect, Option, pipe, Redacted} from 'effect'
import {type NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'

interface ProxyTarget {
  readonly baseUrl: string
  readonly sendsAdminToken: boolean
}

// The first proxy path segment selects the backend, e.g.
// /api/proxy/contact-internal/api/v1/clubs/admin
const PROXY_TARGETS: Readonly<Record<string, ProxyTarget>> = {
  'contact-internal': {
    baseUrl: process.env.CONTACT_INTERNAL_SERVER_URL ?? 'http://localhost:3017',
    sendsAdminToken: true,
  },
  'content-internal': {
    baseUrl: process.env.CONTENT_INTERNAL_SERVER_URL ?? 'http://localhost:3018',
    sendsAdminToken: true,
  },
  content: {
    baseUrl: process.env.CONTENT_API_INTERNAL_URL ?? 'http://localhost:3009',
    sendsAdminToken: false,
  },
}

type ProxyRule = readonly [
  target: string,
  method: string,
  path: string,
  section: BackofficeSection,
]

const cmsRules = (path: string): readonly ProxyRule[] => [
  ['content-internal', 'GET', path, 'cms'],
  ['content-internal', 'POST', path, 'cms'],
  ['content-internal', 'PUT', `${path}/:id`, 'cms'],
  ['content-internal', 'DELETE', `${path}/:id`, 'cms'],
  ['content-internal', 'POST', `${path}/:id/publish`, 'cms'],
  ['content-internal', 'POST', `${path}/:id/unpublish`, 'cms'],
]

const CLUBS_ADMIN = '/api/v1/clubs/admin'
const BANNED_NUMBERS_ADMIN = '/api/v1/banned-numbers/admin'
const PRODUCT_NOTIFICATIONS = '/content/vexl-product-notifications'

// Every backend route the UI calls. Anything else is refused.
const PROXY_RULES: readonly ProxyRule[] = [
  ['contact-internal', 'GET', CLUBS_ADMIN, 'clubs'],
  ['contact-internal', 'POST', CLUBS_ADMIN, 'clubs'],
  ['contact-internal', 'PUT', CLUBS_ADMIN, 'clubs'],
  ['contact-internal', 'GET', `${CLUBS_ADMIN}/stats`, 'clubs'],
  ['contact-internal', 'PUT', `${CLUBS_ADMIN}/reactivate`, 'clubs'],
  ['contact-internal', 'PUT', `${CLUBS_ADMIN}/generate-admin-link`, 'clubs'],
  ['contact-internal', 'POST', `${CLUBS_ADMIN}/request-image-upload`, 'clubs'],
  ['contact-internal', 'POST', BANNED_NUMBERS_ADMIN, 'bannedNumbers'],
  ['contact-internal', 'POST', `${BANNED_NUMBERS_ADMIN}/list`, 'bannedNumbers'],
  [
    'contact-internal',
    'DELETE',
    `${BANNED_NUMBERS_ADMIN}/:id`,
    'bannedNumbers',
  ],
  ...cmsRules('/content/admin/blog-posts'),
  ...cmsRules('/content/admin/events'),
  [
    'content-internal',
    'POST',
    `${PRODUCT_NOTIFICATIONS}/admin`,
    'productNotifications',
  ],
  ['content', 'GET', PRODUCT_NOTIFICATIONS, 'productNotifications'],
]

const PROXY_PREFIX = '/api/proxy/'
const RESPONSE_HEADERS_TO_DROP = [
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'set-cookie',
]

interface ResolvedRequest {
  readonly target: ProxyTarget
  readonly url: URL
  readonly section: BackofficeSection
}

// A `:name` segment of the rule matches any single non-empty path segment.
const matchesPath = (rulePath: string, pathname: string): boolean => {
  const ruleSegments = rulePath.split('/')
  const pathSegments = pathname.split('/')
  return (
    ruleSegments.length === pathSegments.length &&
    pipe(
      Array.zip(ruleSegments, pathSegments),
      Array.every(([ruleSegment, pathSegment]) =>
        ruleSegment.startsWith(':')
          ? pathSegment !== ''
          : ruleSegment === pathSegment
      )
    )
  )
}

// Matches the URL the backend would see, so `..` cannot escape a rule's path.
const resolveRequest = (
  request: NextRequest
): Option.Option<ResolvedRequest> => {
  const [targetName = '', ...segments] = request.nextUrl.pathname
    .slice(PROXY_PREFIX.length)
    .split('/')
  const target = PROXY_TARGETS[targetName]
  if (!target) return Option.none()

  const base = new URL(target.baseUrl)
  const basePath = base.pathname.replace(/\/$/, '')
  const url = new URL(`${basePath}/${segments.join('/')}`, base.origin)
  const backendPath = url.pathname.slice(basePath.length)
  if (
    url.origin !== base.origin ||
    !url.pathname.startsWith(`${basePath}/`) ||
    /[%\\]/.test(url.pathname)
  ) {
    return Option.none()
  }
  url.search = request.nextUrl.search

  return pipe(
    PROXY_RULES,
    Array.findFirst(
      ([ruleTarget, method, path]) =>
        ruleTarget === targetName &&
        method === request.method &&
        matchesPath(path, backendPath)
    ),
    Option.map(([, , , section]) => ({target, url, section}))
  )
}

const forwardedHeaders = (
  request: NextRequest,
  adminToken: Option.Option<string>
): Headers => {
  const headers = new Headers({
    'content-type': request.headers.get('content-type') ?? 'application/json',
  })
  const clientIp = request.headers.get('cf-connecting-ip')
  if (clientIp) headers.set('cf-connecting-ip', clientIp)
  if (Option.isSome(adminToken)) headers.set('x-admin-token', adminToken.value)
  return headers
}

const forward = async (
  request: NextRequest,
  {target, url}: ResolvedRequest,
  adminToken: Option.Option<string>
): Promise<NextResponse> => {
  const startedAt = Date.now()
  const logContext = {method: request.method, path: url.pathname}
  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  try {
    const backendResponse = await fetch(url, {
      method: request.method,
      headers: forwardedHeaders(request, adminToken),
      body: hasBody ? await request.text() : null,
      redirect: 'manual',
    })
    const logResult =
      backendResponse.status >= 500
        ? console.error
        : backendResponse.ok
          ? console.info
          : console.warn
    logResult('Backoffice proxy response', {
      ...logContext,
      target: target.baseUrl,
      status: backendResponse.status,
      durationMs: Date.now() - startedAt,
    })

    const headers = new Headers(backendResponse.headers)
    Array.forEach(RESPONSE_HEADERS_TO_DROP, (header) => {
      headers.delete(header)
    })
    return new NextResponse(await backendResponse.arrayBuffer(), {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers,
    })
  } catch (error) {
    console.error('Backoffice proxy request failed', {
      ...logContext,
      durationMs: Date.now() - startedAt,
      error,
    })
    return NextResponse.json({error: 'Proxy request failed'}, {status: 502})
  }
}

const proxyRequest = (request: NextRequest): Promise<NextResponse> =>
  handleAccessRequest(
    Effect.gen(function* (_) {
      const resolved = yield* _(
        resolveRequest(request),
        Effect.mapError(() => accessError(404, 'Unknown proxy path'))
      )
      yield* _(requireSessionSection(request, resolved.section))
      const adminToken = resolved.target.sendsAdminToken
        ? Option.some(Redacted.value(yield* _(adminTokenConfig)))
        : Option.none()
      return yield* _(
        Effect.promise(() => forward(request, resolved, adminToken))
      )
    })
  )

export const GET = proxyRequest
export const POST = proxyRequest
export const PUT = proxyRequest
export const DELETE = proxyRequest
