import {Array, Effect, pipe} from 'effect'
import {NextRequest, type NextResponse} from 'next/server'
import {randomUUID} from 'node:crypto'
import {
  createInvite,
  createSession,
  registerInvitedPasskey,
} from '../../server/access/repository'
import {SESSION_COOKIE} from '../../server/access/session'
import {hashToken} from '../../server/access/tokens'
import {runDb} from '../../server/db'
import {type BackofficeSection} from '../../services/access/domain'

export const ORIGIN = 'https://backoffice.test'

type Handler = (request: NextRequest) => Promise<NextResponse>

interface RequestOptions {
  readonly body?: unknown
  /** Defaults to what a browser sends from the backoffice; `null` sends none. */
  readonly origin?: string | null
  readonly headers?: Readonly<Record<string, string>>
}

export interface Browser {
  readonly cookies: Map<string, string>
  readonly send: (
    handler: Handler,
    method: string,
    path: string,
    options?: RequestOptions
  ) => Promise<NextResponse>
}

/** Calls route handlers the way one browser would, keeping its cookies between calls. */
export const makeBrowser = (appOrigin = ORIGIN): Browser => {
  const cookies = new Map<string, string>()

  const send: Browser['send'] = async (
    handler,
    method,
    path,
    {body, origin = method === 'GET' ? null : appOrigin, headers = {}} = {}
  ) => {
    const response = await handler(
      new NextRequest(new URL(path, appOrigin), {
        method,
        headers: {
          'content-type': 'application/json',
          ...headers,
          ...(origin === null ? {} : {origin}),
          cookie: pipe(
            Array.fromIterable(cookies),
            Array.map(([name, value]) => `${name}=${value}`),
            Array.join('; ')
          ),
        },
        body: body === undefined ? null : JSON.stringify(body),
      })
    )
    Array.forEach(response.cookies.getAll(), ({name, value, maxAge}) => {
      if (maxAge === 0) cookies.delete(name)
      else cookies.set(name, value)
    })
    return response
  }

  return {cookies, send}
}

/** A browser already signed in with a passkey that has exactly `sections`. */
export const signedInBrowser = async (
  sections: readonly BackofficeSection[]
): Promise<Browser & {readonly passkeyId: string}> => {
  const {passkeyId, sessionToken} = await runDb(
    Effect.gen(function* (_) {
      const invite = yield* _(createInvite('Tester', sections))
      const passkey = yield* _(
        registerInvitedPasskey(
          {
            id: randomUUID(),
            publicKey: new Uint8Array([1, 2, 3]),
            counter: 0,
            transports: [],
          },
          hashToken(invite.token)
        )
      )
      return {
        passkeyId: passkey.id,
        sessionToken: yield* _(createSession(passkey.id)),
      }
    })
  )
  const browser = makeBrowser()
  browser.cookies.set(SESSION_COOKIE, sessionToken)
  return {...browser, passkeyId}
}
