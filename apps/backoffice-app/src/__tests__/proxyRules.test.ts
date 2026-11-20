import {Option} from 'effect'
import {resolveProxyRequest} from '../server/proxyRules'

const resolve = (method: string, proxyPath: string, search = '') =>
  resolveProxyRequest(method, {pathname: `/api/proxy/${proxyPath}`, search})

const CLUBS = 'contact-internal/api/v1/clubs/admin'
const BANNED_NUMBERS = 'contact-internal/api/v1/banned-numbers/admin'
const BLOG_POSTS = 'content-internal/content/admin/blog-posts'
const EVENTS = 'content-internal/content/admin/events'
const NOTIFICATIONS = 'content/vexl-product-notifications'

describe('proxy rules', () => {
  it.each([
    ['GET', CLUBS, 'clubs'],
    ['POST', CLUBS, 'clubs'],
    ['PUT', CLUBS, 'clubs'],
    ['GET', `${CLUBS}/stats`, 'clubs'],
    ['PUT', `${CLUBS}/reactivate`, 'clubs'],
    ['PUT', `${CLUBS}/generate-admin-link`, 'clubs'],
    ['POST', `${CLUBS}/request-image-upload`, 'clubs'],
    ['POST', BANNED_NUMBERS, 'bannedNumbers'],
    ['POST', `${BANNED_NUMBERS}/list`, 'bannedNumbers'],
    ['DELETE', `${BANNED_NUMBERS}/42`, 'bannedNumbers'],
    ['GET', BLOG_POSTS, 'cms'],
    ['POST', BLOG_POSTS, 'cms'],
    ['PUT', `${BLOG_POSTS}/7`, 'cms'],
    ['DELETE', `${BLOG_POSTS}/7`, 'cms'],
    ['POST', `${BLOG_POSTS}/7/publish`, 'cms'],
    ['POST', `${BLOG_POSTS}/7/unpublish`, 'cms'],
    ['GET', EVENTS, 'cms'],
    ['POST', EVENTS, 'cms'],
    ['PUT', `${EVENTS}/7`, 'cms'],
    ['DELETE', `${EVENTS}/7`, 'cms'],
    ['POST', `${EVENTS}/7/publish`, 'cms'],
    ['POST', `${EVENTS}/7/unpublish`, 'cms'],
    ['POST', `content-internal/${NOTIFICATIONS}/admin`, 'productNotifications'],
    ['GET', `content/${NOTIFICATIONS}`, 'productNotifications'],
  ])('lets %s %s through for the %s section', (method, path, section) => {
    const resolved = resolve(method, path)

    expect(Option.map(resolved, (request) => request.section)).toEqual(
      Option.some(section)
    )
  })

  it.each([
    ['an unknown backend', 'GET', 'user-internal/api/v1/clubs/admin'],
    ['no backend', 'GET', ''],
    ['a route below a listed one', 'GET', `${CLUBS}/not-a-route`],
    ['a route above a listed one', 'GET', 'contact-internal/api/v1/clubs'],
    ['a listed route with another method', 'POST', `${CLUBS}/stats`],
    ['a debug route', 'POST', 'contact-internal/test-hashing-speed'],
    ['an admin route on the public backend', 'GET', `content/${BLOG_POSTS}`],
    ['an item route without an id', 'PUT', `${BLOG_POSTS}/`],
    ['an id that spans two segments', 'PUT', `${BLOG_POSTS}/7/8`],
    ['a trailing slash', 'GET', `${CLUBS}/`],
    ['an encoded slash', 'GET', `${CLUBS}%2Fstats`],
    ['an encoded id', 'DELETE', `${BLOG_POSTS}/%37`],
    [
      'a path that climbs above the backend root',
      'GET',
      `${CLUBS}/../../../..`,
    ],
  ])('refuses %s', (_, method, path) => {
    expect(resolve(method, path)).toEqual(Option.none())
  })

  it.each([
    [
      'a `..` path',
      `${BLOG_POSTS}/../../vexl-product-notifications/admin`,
      'productNotifications',
      '/content/vexl-product-notifications/admin',
    ],
    [
      'a backslash path',
      `${BLOG_POSTS}\\7\\publish`,
      'cms',
      '/content/admin/blog-posts/7/publish',
    ],
  ])(
    'checks the section of the route %s really ends at',
    (_, path, section, backendPath) => {
      const resolved = resolve('POST', path)

      expect(
        Option.map(resolved, (request) => [
          request.section,
          request.url.pathname,
        ])
      ).toEqual(Option.some([section, backendPath]))
    }
  )

  it('keeps the query string', () => {
    const resolved = resolve('GET', `content/${NOTIFICATIONS}`, '?newerThan=1')

    expect(Option.map(resolved, ({url}) => url.search)).toEqual(
      Option.some('?newerThan=1')
    )
  })

  it.each([
    [CLUBS, true],
    [BLOG_POSTS, true],
    [`content/${NOTIFICATIONS}`, false],
  ])('sends the admin token to %s: %s', (path, sendsAdminToken) => {
    const resolved = resolve('GET', path)

    expect(Option.map(resolved, ({target}) => target.sendsAdminToken)).toEqual(
      Option.some(sendsAdminToken)
    )
  })
})
