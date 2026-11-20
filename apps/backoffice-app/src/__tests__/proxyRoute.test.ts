import * as proxyRoute from '@/app/api/proxy/[...path]/route'
import {SESSION_COOKIE} from '../server/access/session'
import {type Browser, makeBrowser, signedInBrowser} from './utils/browser'
import {setUpTestDatabase} from './utils/testDb'

setUpTestDatabase()

const CLUBS = '/api/proxy/contact-internal/api/v1/clubs/admin'
const BLOG_POSTS = '/api/proxy/content-internal/content/admin/blog-posts'
const NOTIFICATIONS = '/api/proxy/content/content/vexl-product-notifications'

const backend = jest.spyOn(globalThis, 'fetch')

beforeEach(() => {
  backend.mockReset().mockImplementation(
    async () =>
      new Response('{"from":"backend"}', {
        status: 201,
        headers: {
          'content-type': 'application/json',
          'set-cookie': 'backend=cookie',
        },
      })
  )
})

const get = (browser: Browser, path: string) =>
  browser.send(proxyRoute.GET, 'GET', path, {
    headers: {'x-admin-token': 'sent-by-the-browser'},
  })

const forwarded = () => {
  const [url, init] = backend.mock.calls[0] ?? []
  return {
    url: String(url),
    init,
    headers: new Headers(init?.headers),
  }
}

describe('proxy', () => {
  it('needs a session', async () => {
    const response = await get(makeBrowser(), CLUBS)

    expect(response.status).toBe(401)
    expect(backend).not.toHaveBeenCalled()
  })

  it('needs the section of the route', async () => {
    const editor = await signedInBrowser(['cms'])

    const response = await get(editor, CLUBS)

    expect(response.status).toBe(403)
    expect(backend).not.toHaveBeenCalled()
  })

  it('does not reach routes outside the list, even for a full admin', async () => {
    const admin = await signedInBrowser(['clubs', 'cms', 'admins'])

    const response = await get(admin, `${CLUBS}/not-a-route`)

    expect(response.status).toBe(404)
    expect(backend).not.toHaveBeenCalled()
  })

  it('refuses a request from another origin', async () => {
    const admin = await signedInBrowser(['clubs'])

    const response = await admin.send(proxyRoute.PUT, 'PUT', CLUBS, {
      origin: 'https://evil.test',
      body: {},
    })

    expect(response.status).toBe(403)
    expect(backend).not.toHaveBeenCalled()
  })

  it('forwards an allowed request and returns the backend answer', async () => {
    const admin = await signedInBrowser(['clubs'])

    const response = await get(admin, `${CLUBS}/stats?clubUuid=1`)

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({from: 'backend'})
    expect(forwarded().url).toBe(
      'http://localhost:3017/api/v1/clubs/admin/stats?clubUuid=1'
    )
    expect(forwarded().init).toMatchObject({method: 'GET', redirect: 'manual'})
  })

  it('forwards the body of a write', async () => {
    const editor = await signedInBrowser(['cms'])

    await editor.send(proxyRoute.POST, 'POST', BLOG_POSTS, {
      body: {title: 'Hello'},
    })

    expect(forwarded().init).toMatchObject({
      method: 'POST',
      body: '{"title":"Hello"}',
    })
  })

  it('sends the server admin token instead of what the browser sent', async () => {
    const admin = await signedInBrowser(['clubs'])

    await get(admin, CLUBS)

    expect(forwarded().headers.get('x-admin-token')).toBe('test-admin-token')
  })

  it('sends no admin token to the public backend', async () => {
    const admin = await signedInBrowser(['productNotifications'])

    await get(admin, NOTIFICATIONS)

    expect(forwarded().url).toBe(
      'http://localhost:3009/content/vexl-product-notifications'
    )
    expect(forwarded().headers.has('x-admin-token')).toBe(false)
  })

  it('keeps the session cookie away from the backend', async () => {
    const admin = await signedInBrowser(['clubs'])

    await get(admin, CLUBS)

    expect(forwarded().headers.has('cookie')).toBe(false)
  })

  it('keeps backend cookies away from the browser', async () => {
    const admin = await signedInBrowser(['clubs'])

    const response = await get(admin, CLUBS)

    expect(response.headers.has('set-cookie')).toBe(false)
    expect([...admin.cookies.keys()]).toEqual([SESSION_COOKIE])
  })

  it('answers 502 when the backend is down', async () => {
    const admin = await signedInBrowser(['clubs'])
    backend.mockRejectedValueOnce(new Error('connection refused'))

    const response = await get(admin, CLUBS)

    expect(response.status).toBe(502)
  })
})
