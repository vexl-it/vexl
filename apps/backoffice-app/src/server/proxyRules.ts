import {Array, Option, pipe} from 'effect'
import {type BackofficeSection} from '../services/access/domain'

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

export interface ResolvedProxyRequest {
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
export const resolveProxyRequest = (
  method: string,
  {pathname, search}: {readonly pathname: string; readonly search: string}
): Option.Option<ResolvedProxyRequest> => {
  const [targetName = '', ...segments] = pathname
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
  url.search = search

  return pipe(
    PROXY_RULES,
    Array.findFirst(
      ([ruleTarget, ruleMethod, path]) =>
        ruleTarget === targetName &&
        ruleMethod === method &&
        matchesPath(path, backendPath)
    ),
    Option.map(([, , , section]) => ({target, url, section}))
  )
}
