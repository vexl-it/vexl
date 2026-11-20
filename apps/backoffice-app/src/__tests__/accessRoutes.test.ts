import * as invitesRoute from '@/app/api/admin/invites/route'
import * as passkeyRoute from '@/app/api/admin/passkeys/[id]/route'
import * as passkeysRoute from '@/app/api/admin/passkeys/route'
import * as sessionRoute from '@/app/api/admin/session/route'
import * as shortLinksRoute from '@/app/api/admin/short-links/route'
import * as inviteRoute from '@/app/api/auth/invite/route'
import * as loginOptionsRoute from '@/app/api/auth/login/options/route'
import * as loginRoute from '@/app/api/auth/login/route'
import * as logoutRoute from '@/app/api/auth/logout/route'
import * as registerRoute from '@/app/api/auth/register/route'
import * as setupRoute from '@/app/api/auth/setup/route'
import type * as WebAuthn from '@simplewebauthn/server'
import {
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import {Option, Schema} from 'effect'
import {type NextRequest, type NextResponse} from 'next/server'
import {findCredential} from '../server/access/repository'
import {CHALLENGE_COOKIE, SESSION_COOKIE} from '../server/access/session'
import {runDb} from '../server/db'
import {
  ALL_SECTIONS,
  type BackofficeSection,
  CreateInviteResponse,
} from '../services/access/domain'
import {
  type Browser,
  makeBrowser,
  ORIGIN,
  signedInBrowser,
} from './utils/browser'
import {expireRows, setUpTestDatabase} from './utils/testDb'

jest.mock('@simplewebauthn/server', () => ({
  ...jest.requireActual<typeof WebAuthn>('@simplewebauthn/server'),
  verifyRegistrationResponse: jest.fn(),
  verifyAuthenticationResponse: jest.fn(),
}))

setUpTestDatabase()

const RP_ID = 'backoffice.test'
const ADMIN_TOKEN = 'test-admin-token'
const FOREIGN_ORIGIN = 'https://evil.test'
const UNKNOWN_PASSKEY_ID = '00000000-0000-4000-8000-000000000000'

const Challenge = Schema.Struct({challenge: Schema.String})

const challengeOf = async (response: NextResponse): Promise<string> =>
  Schema.decodeUnknownSync(Challenge)(await response.json()).challenge

// The authenticator's answers are opaque to the routes; only `id` matters here.
const registrationResponse = (credentialId: string) => ({
  id: credentialId,
  rawId: credentialId,
  type: 'public-key',
  clientExtensionResults: {},
  response: {clientDataJSON: 'client-data', attestationObject: 'attestation'},
})

const authenticationResponse = (credentialId: string) => ({
  id: credentialId,
  rawId: credentialId,
  type: 'public-key',
  clientExtensionResults: {},
  response: {
    clientDataJSON: 'client-data',
    authenticatorData: 'authenticator-data',
    signature: 'signature',
  },
})

beforeEach(() => {
  jest
    .mocked(verifyRegistrationResponse)
    .mockReset()
    .mockImplementation(async ({response}) => ({
      verified: true,
      registrationInfo: {
        fmt: 'none',
        aaguid: '00000000-0000-0000-0000-000000000000',
        credential: {
          id: response.id,
          publicKey: new Uint8Array([1, 2, 3]),
          counter: 0,
          transports: ['internal'],
        },
        credentialType: 'public-key',
        attestationObject: new Uint8Array(),
        userVerified: true,
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        origin: ORIGIN,
        rpID: RP_ID,
      },
    }))
  jest
    .mocked(verifyAuthenticationResponse)
    .mockReset()
    .mockImplementation(async ({response, credential}) => ({
      verified: true,
      authenticationInfo: {
        credentialID: response.id,
        newCounter: credential.counter + 1,
        userVerified: true,
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
        origin: ORIGIN,
        rpID: RP_ID,
      },
    }))
})

const requestSetup = (browser: Browser, adminToken = ADMIN_TOKEN) =>
  browser.send(setupRoute.POST, 'POST', '/api/auth/setup', {
    body: {adminToken, label: 'First'},
  })

const register = (browser: Browser, credentialId: string) =>
  browser.send(registerRoute.POST, 'POST', '/api/auth/register', {
    body: registrationResponse(credentialId),
  })

const setUpFirstAdmin = async (browser: Browser, credentialId = 'first') => {
  await requestSetup(browser)
  return await register(browser, credentialId)
}

const createInvite = (
  browser: Browser,
  sections: readonly BackofficeSection[]
) =>
  browser.send(invitesRoute.POST, 'POST', '/api/admin/invites', {
    body: {label: 'Editor', sections},
  })

const inviteTokenOf = async (response: NextResponse): Promise<string> => {
  const {inviteUrl} = Schema.decodeUnknownSync(CreateInviteResponse)(
    await response.json()
  )
  return new URL(inviteUrl).hash.slice(1)
}

const openInvite = (browser: Browser, inviteToken: string) =>
  browser.send(inviteRoute.POST, 'POST', '/api/auth/invite', {
    body: {inviteToken},
  })

const requestLogin = (browser: Browser) =>
  browser.send(loginOptionsRoute.POST, 'POST', '/api/auth/login/options')

const logIn = (browser: Browser, credentialId: string) =>
  browser.send(loginRoute.POST, 'POST', '/api/auth/login', {
    body: authenticationResponse(credentialId),
  })

const getSession = (browser: Browser) =>
  browser.send(sessionRoute.GET, 'GET', '/api/admin/session')

const listPasskeys = (browser: Browser) =>
  browser.send(passkeysRoute.GET, 'GET', '/api/admin/passkeys')

const passkeyContext = (id: string) => ({params: Promise.resolve({id})})

const changeSections = (
  browser: Browser,
  passkeyId: string,
  sections: readonly BackofficeSection[]
) =>
  browser.send(
    (request) => passkeyRoute.PATCH(request, passkeyContext(passkeyId)),
    'PATCH',
    `/api/admin/passkeys/${passkeyId}`,
    {body: {sections}}
  )

const deletePasskey = (browser: Browser, passkeyId: string) =>
  browser.send(
    (request) => passkeyRoute.DELETE(request, passkeyContext(passkeyId)),
    'DELETE',
    `/api/admin/passkeys/${passkeyId}`
  )

describe('first admin setup', () => {
  it('is offered until a passkey exists', async () => {
    const browser = makeBrowser()
    const isSetupRequired = async () =>
      await (
        await browser.send(setupRoute.GET, 'GET', '/api/auth/setup')
      ).json()

    expect(await isSetupRequired()).toEqual({setupRequired: true})

    await setUpFirstAdmin(browser)

    expect(await isSetupRequired()).toEqual({setupRequired: false})
  })

  it('asks for a discoverable passkey with user verification', async () => {
    const response = await requestSetup(makeBrowser())

    expect(await response.json()).toMatchObject({
      rp: {id: RP_ID},
      user: {name: 'First'},
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
      },
    })
  })

  it('registers a passkey with every section and signs it in', async () => {
    const browser = makeBrowser()

    const response = await setUpFirstAdmin(browser)

    const session = {label: 'First', sections: ALL_SECTIONS}
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(session)
    expect(await (await getSession(browser)).json()).toEqual(session)
  })

  it('verifies the passkey against its own challenge and origin', async () => {
    const browser = makeBrowser()
    const challenge = await challengeOf(await requestSetup(browser))

    await register(browser, 'first')

    expect(verifyRegistrationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
      })
    )
  })

  it('refuses a wrong admin token', async () => {
    const browser = makeBrowser()

    const response = await requestSetup(browser, 'wrong')

    expect(response.status).toBe(401)
    expect(browser.cookies.has(CHALLENGE_COOKIE)).toBe(false)
  })

  it('refuses the admin token once an admin exists', async () => {
    await setUpFirstAdmin(makeBrowser())

    const response = await requestSetup(makeBrowser())

    expect(response.status).toBe(409)
  })

  it('lets only the first of two started setups finish', async () => {
    const first = makeBrowser()
    const second = makeBrowser()
    await requestSetup(first)
    await requestSetup(second)

    await register(first, 'first')
    const response = await register(second, 'second')

    expect(response.status).toBe(409)
    expect(second.cookies.has(SESSION_COOKIE)).toBe(false)
  })

  it.each([
    [
      'is rejected',
      () =>
        jest
          .mocked(verifyRegistrationResponse)
          .mockResolvedValueOnce({verified: false}),
    ],
    [
      'cannot be verified',
      () =>
        jest
          .mocked(verifyRegistrationResponse)
          .mockRejectedValueOnce(new Error('bad attestation')),
    ],
  ])('registers nothing when the passkey %s', async (_, failVerification) => {
    const browser = makeBrowser()
    await requestSetup(browser)
    failVerification()

    const response = await register(browser, 'first')

    expect(response.status).toBe(400)
    expect(browser.cookies.has(SESSION_COOKIE)).toBe(false)
    expect(await runDb(findCredential('first'))).toEqual(Option.none())
  })
})

describe('session cookie', () => {
  afterEach(() => {
    process.env.BACKOFFICE_ORIGIN = ORIGIN
  })

  it('is httpOnly, strict, secure and valid for 12 hours', async () => {
    const response = await setUpFirstAdmin(makeBrowser())

    expect(response.cookies.get(SESSION_COOKIE)).toMatchObject({
      httpOnly: true,
      sameSite: 'strict',
      secure: true,
      path: '/',
      maxAge: 12 * 60 * 60,
    })
  })

  it('is not secure on a plain http origin, so local sign-in works', async () => {
    process.env.BACKOFFICE_ORIGIN = 'http://localhost:3000'

    const response = await setUpFirstAdmin(makeBrowser('http://localhost:3000'))

    expect(response.cookies.get(SESSION_COOKIE)).toMatchObject({
      httpOnly: true,
      secure: false,
    })
  })
})

describe('invites', () => {
  it('can only be created with the Admins section', async () => {
    const editor = await signedInBrowser(['cms'])

    expect((await createInvite(makeBrowser(), ['cms'])).status).toBe(401)
    expect((await createInvite(editor, ['cms'])).status).toBe(403)
  })

  it('put the token in the fragment of a backoffice link', async () => {
    const admin = await signedInBrowser(['admins'])

    const response = await createInvite(admin, ['cms'])

    const {inviteUrl} = Schema.decodeUnknownSync(CreateInviteResponse)(
      await response.json()
    )
    const url = new URL(inviteUrl)
    expect(response.status).toBe(201)
    expect([url.origin, url.pathname, url.search]).toEqual([
      ORIGIN,
      '/invite',
      '',
    ])
    expect(url.hash.length).toBeGreaterThan(40)
  })

  it.each([
    ['no sections', []],
    ['an unknown section', ['cms', 'everything']],
  ])('cannot be created with %s', async (_, sections) => {
    const admin = await signedInBrowser(['admins'])

    const response = await admin.send(
      invitesRoute.POST,
      'POST',
      '/api/admin/invites',
      {body: {label: 'Editor', sections}}
    )

    expect(response.status).toBe(400)
  })

  it('sign the new passkey in with the sections of the invite', async () => {
    const admin = await signedInBrowser(['admins'])
    const token = await inviteTokenOf(
      await createInvite(admin, ['cms', 'shortLinks'])
    )
    const invited = makeBrowser()

    await openInvite(invited, token)
    const response = await register(invited, 'editor')

    const session = {label: 'Editor', sections: ['cms', 'shortLinks']}
    expect(response.status).toBe(200)
    expect(await (await getSession(invited)).json()).toEqual(session)
  })

  it('work once', async () => {
    const admin = await signedInBrowser(['admins'])
    const token = await inviteTokenOf(await createInvite(admin, ['cms']))
    const invited = makeBrowser()
    await openInvite(invited, token)
    await register(invited, 'editor')

    const response = await openInvite(makeBrowser(), token)

    expect(response.status).toBe(404)
  })

  it('give access to only the first of two people who opened one', async () => {
    const admin = await signedInBrowser(['admins'])
    const token = await inviteTokenOf(await createInvite(admin, ['cms']))
    const first = makeBrowser()
    const second = makeBrowser()
    await openInvite(first, token)
    await openInvite(second, token)

    await register(first, 'first')
    const response = await register(second, 'second')

    expect(response.status).toBe(404)
    expect(second.cookies.has(SESSION_COOKIE)).toBe(false)
  })

  it('cannot be opened once expired', async () => {
    const admin = await signedInBrowser(['admins'])
    const token = await inviteTokenOf(await createInvite(admin, ['cms']))

    await expireRows('backoffice_invites')

    expect((await openInvite(makeBrowser(), token)).status).toBe(404)
  })

  it('cannot be finished once expired', async () => {
    const admin = await signedInBrowser(['admins'])
    const token = await inviteTokenOf(await createInvite(admin, ['cms']))
    const invited = makeBrowser()
    await openInvite(invited, token)

    await expireRows('backoffice_invites')

    expect((await register(invited, 'editor')).status).toBe(404)
  })

  it('cannot be opened with a made-up token', async () => {
    expect((await openInvite(makeBrowser(), 'made-up')).status).toBe(404)
  })
})

describe('sign-in', () => {
  it('signs a registered passkey in with its sections', async () => {
    await setUpFirstAdmin(makeBrowser())
    const browser = makeBrowser()

    await requestLogin(browser)
    const response = await logIn(browser, 'first')

    const session = {label: 'First', sections: ALL_SECTIONS}
    expect(response.status).toBe(200)
    expect(await (await getSession(browser)).json()).toEqual(session)
  })

  it('verifies the passkey against its own challenge and origin', async () => {
    await setUpFirstAdmin(makeBrowser())
    const browser = makeBrowser()
    const challenge = await challengeOf(await requestLogin(browser))

    await logIn(browser, 'first')

    expect(verifyAuthenticationResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        expectedChallenge: challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
        credential: expect.objectContaining({id: 'first', counter: 0}),
      })
    )
  })

  it('stores the new signature counter', async () => {
    await setUpFirstAdmin(makeBrowser())
    const browser = makeBrowser()
    await requestLogin(browser)

    await logIn(browser, 'first')

    const stored = await runDb(findCredential('first'))
    expect(Option.map(stored, ({counter}) => counter)).toEqual(Option.some(1))
  })

  it('refuses a passkey nobody registered', async () => {
    await setUpFirstAdmin(makeBrowser())
    const browser = makeBrowser()
    await requestLogin(browser)

    const response = await logIn(browser, 'stranger')

    expect(response.status).toBe(401)
    expect(browser.cookies.has(SESSION_COOKIE)).toBe(false)
  })

  it('refuses a passkey that fails verification', async () => {
    await setUpFirstAdmin(makeBrowser())
    const browser = makeBrowser()
    await requestLogin(browser)
    jest
      .mocked(verifyAuthenticationResponse)
      .mockRejectedValueOnce(new Error('bad signature'))

    const response = await logIn(browser, 'first')

    expect(response.status).toBe(400)
    expect(browser.cookies.has(SESSION_COOKIE)).toBe(false)
  })

  it('uses up the challenge on a failed attempt', async () => {
    await setUpFirstAdmin(makeBrowser())
    const browser = makeBrowser()
    await requestLogin(browser)
    jest
      .mocked(verifyAuthenticationResponse)
      .mockRejectedValueOnce(new Error('bad signature'))
    await logIn(browser, 'first')

    const response = await logIn(browser, 'first')

    expect(response.status).toBe(400)
    expect(verifyAuthenticationResponse).toHaveBeenCalledTimes(1)
  })

  it('needs a challenge', async () => {
    await setUpFirstAdmin(makeBrowser())

    const response = await logIn(makeBrowser(), 'first')

    expect(response.status).toBe(400)
  })

  it('refuses an expired challenge', async () => {
    await setUpFirstAdmin(makeBrowser())
    const browser = makeBrowser()
    await requestLogin(browser)

    await expireRows('backoffice_webauthn_challenges')

    expect((await logIn(browser, 'first')).status).toBe(400)
  })

  it('does not accept a sign-in challenge for a registration', async () => {
    const browser = makeBrowser()
    await requestLogin(browser)

    const response = await register(browser, 'first')

    expect(response.status).toBe(400)
    expect(await runDb(findCredential('first'))).toEqual(Option.none())
  })

  it('does not accept a registration challenge for a sign-in', async () => {
    await setUpFirstAdmin(makeBrowser())
    const admin = await signedInBrowser(['admins'])
    const token = await inviteTokenOf(await createInvite(admin, ['cms']))
    const browser = makeBrowser()
    await openInvite(browser, token)

    const response = await logIn(browser, 'first')

    expect(response.status).toBe(400)
    expect(browser.cookies.has(SESSION_COOKIE)).toBe(false)
  })
})

describe('sign-out', () => {
  it('ends the session on the server, not only in the browser', async () => {
    const browser = await signedInBrowser(['cms'])
    const copiedCookie = makeBrowser()
    copiedCookie.cookies.set(
      SESSION_COOKIE,
      browser.cookies.get(SESSION_COOKIE) ?? ''
    )

    const response = await browser.send(
      logoutRoute.POST,
      'POST',
      '/api/auth/logout'
    )

    expect(response.status).toBe(204)
    expect(browser.cookies.has(SESSION_COOKIE)).toBe(false)
    expect((await getSession(copiedCookie)).status).toBe(401)
  })
})

describe('sessions', () => {
  it('are required', async () => {
    expect((await getSession(makeBrowser())).status).toBe(401)
  })

  it('cannot be made up', async () => {
    const browser = makeBrowser()
    browser.cookies.set(SESSION_COOKIE, 'made-up')

    expect((await getSession(browser)).status).toBe(401)
  })

  it('end after their lifetime', async () => {
    const browser = await signedInBrowser(['cms'])

    await expireRows('backoffice_sessions')

    expect((await getSession(browser)).status).toBe(401)
  })

  it('open only the sections of their passkey', async () => {
    const editor = await signedInBrowser(['cms'])
    const linker = await signedInBrowser(['shortLinks'])
    const listShortLinks = (browser: Browser) =>
      browser.send(shortLinksRoute.GET, 'GET', '/api/admin/short-links')

    expect((await listShortLinks(makeBrowser())).status).toBe(401)
    expect((await listShortLinks(editor)).status).toBe(403)
    expect((await listShortLinks(linker)).status).toBe(200)
  })
})

describe('managing passkeys', () => {
  it('needs the Admins section', async () => {
    const editor = await signedInBrowser(['cms'])

    expect((await listPasskeys(makeBrowser())).status).toBe(401)
    expect((await listPasskeys(editor)).status).toBe(403)
    expect(
      (await changeSections(editor, editor.passkeyId, ALL_SECTIONS)).status
    ).toBe(403)
    expect((await deletePasskey(editor, editor.passkeyId)).status).toBe(403)
  })

  it('lists every passkey without its credential', async () => {
    const admin = await signedInBrowser(['admins'])
    const editor = await signedInBrowser(['cms'])

    const response = await listPasskeys(admin)

    expect(await response.json()).toEqual({
      passkeys: [
        {
          id: admin.passkeyId,
          label: 'Tester',
          sections: ['admins'],
          createdAt: expect.any(String),
          lastUsedAt: null,
        },
        {
          id: editor.passkeyId,
          label: 'Tester',
          sections: ['cms'],
          createdAt: expect.any(String),
          lastUsedAt: null,
        },
      ],
    })
  })

  it('applies a section change to a session that is already open', async () => {
    const admin = await signedInBrowser(['admins'])
    const editor = await signedInBrowser(['cms'])

    const response = await changeSections(admin, editor.passkeyId, [
      'shortLinks',
    ])

    expect(response.status).toBe(200)
    expect(await (await getSession(editor)).json()).toEqual({
      label: 'Tester',
      sections: ['shortLinks'],
    })
  })

  it('ends the sessions of a deleted passkey', async () => {
    const admin = await signedInBrowser(['admins'])
    const editor = await signedInBrowser(['cms'])

    const response = await deletePasskey(admin, editor.passkeyId)

    expect(response.status).toBe(204)
    expect((await getSession(editor)).status).toBe(401)
  })

  it('keeps the last passkey with the Admins section', async () => {
    const admin = await signedInBrowser(['admins'])
    await signedInBrowser(['cms'])

    expect((await deletePasskey(admin, admin.passkeyId)).status).toBe(409)
    expect((await changeSections(admin, admin.passkeyId, ['cms'])).status).toBe(
      409
    )
    expect((await getSession(admin)).status).toBe(200)
  })

  it.each([
    ['no sections', []],
    ['an unknown section', ['everything']],
  ])('refuses a change to %s', async (_, sections) => {
    const admin = await signedInBrowser(['admins'])

    const response = await admin.send(
      (request) => passkeyRoute.PATCH(request, passkeyContext(admin.passkeyId)),
      'PATCH',
      `/api/admin/passkeys/${admin.passkeyId}`,
      {body: {sections}}
    )

    expect(response.status).toBe(400)
  })

  it.each([
    ['an unknown passkey', UNKNOWN_PASSKEY_ID],
    ['a malformed id', 'not-a-uuid'],
  ])('answers 404 for %s', async (_, passkeyId) => {
    const admin = await signedInBrowser(['admins'])

    expect((await deletePasskey(admin, passkeyId)).status).toBe(404)
    expect((await changeSections(admin, passkeyId, ['cms'])).status).toBe(404)
  })
})

describe('requests that change state', () => {
  const routes: ReadonlyArray<
    readonly [
      path: string,
      method: string,
      handler: (request: NextRequest) => Promise<NextResponse>,
    ]
  > = [
    ['/api/auth/setup', 'POST', setupRoute.POST],
    ['/api/auth/invite', 'POST', inviteRoute.POST],
    ['/api/auth/register', 'POST', registerRoute.POST],
    ['/api/auth/login/options', 'POST', loginOptionsRoute.POST],
    ['/api/auth/login', 'POST', loginRoute.POST],
    ['/api/auth/logout', 'POST', logoutRoute.POST],
    ['/api/admin/invites', 'POST', invitesRoute.POST],
    ['/api/admin/short-links', 'POST', shortLinksRoute.POST],
    [
      `/api/admin/passkeys/${UNKNOWN_PASSKEY_ID}`,
      'PATCH',
      (request) =>
        passkeyRoute.PATCH(request, passkeyContext(UNKNOWN_PASSKEY_ID)),
    ],
    [
      `/api/admin/passkeys/${UNKNOWN_PASSKEY_ID}`,
      'DELETE',
      (request) =>
        passkeyRoute.DELETE(request, passkeyContext(UNKNOWN_PASSKEY_ID)),
    ],
  ]

  it.each(routes)(
    '%s %s is refused from another origin or without one',
    async (path, method, handler) => {
      const admin = await signedInBrowser(ALL_SECTIONS)
      const send = (origin: string | null) =>
        admin.send(handler, method, path, {origin, body: {}})

      expect((await send(FOREIGN_ORIGIN)).status).toBe(403)
      expect((await send(null)).status).toBe(403)
      expect(admin.cookies.has(SESSION_COOKIE)).toBe(true)
    }
  )
})

describe('BACKOFFICE_DISABLE_AUTH outside production', () => {
  beforeEach(() => {
    process.env.BACKOFFICE_DISABLE_AUTH = 'true'
  })

  afterEach(() => {
    process.env.BACKOFFICE_DISABLE_AUTH = 'false'
  })

  it('treats every request as an admin with all sections', async () => {
    const response = await getSession(makeBrowser())

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({sections: ALL_SECTIONS})
  })
})
