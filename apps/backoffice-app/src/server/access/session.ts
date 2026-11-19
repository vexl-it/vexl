import {
  ALL_SECTIONS,
  type BackofficeSection,
  type BackofficeSession,
} from '@/src/services/access/domain'
import {type PgClient} from '@effect/sql-pg'
import {type SqlError} from '@effect/sql/SqlError'
import {Array, type ConfigError, Effect, Option} from 'effect'
import {type NextRequest, type NextResponse} from 'next/server'
import {backofficeOriginConfig, isAuthDisabled} from '../config'
import {accessError, type AccessRequestError} from './errors'
import {
  CHALLENGE_LIFETIME_SECONDS,
  findSessionPasskey,
  SESSION_LIFETIME_SECONDS,
} from './repository'

export const SESSION_COOKIE = 'backoffice_session'
export const CHALLENGE_COOKIE = 'backoffice_webauthn_challenge'

const AUTH_DISABLED_SESSION: BackofficeSession = {
  label: 'Local development (auth disabled)',
  sections: ALL_SECTIONS,
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export const assertSameOrigin = (
  request: NextRequest
): Effect.Effect<void, AccessRequestError | ConfigError.ConfigError> =>
  isAuthDisabled() || Array.contains(SAFE_METHODS, request.method)
    ? Effect.void
    : Effect.flatMap(backofficeOriginConfig, (origin) =>
        request.headers.get('origin') === origin.origin
          ? Effect.void
          : Effect.fail(accessError(403, 'Cross-origin request refused'))
      )

export const currentSession = (
  request: NextRequest
): Effect.Effect<
  BackofficeSession,
  AccessRequestError | ConfigError.ConfigError | SqlError,
  PgClient.PgClient
> =>
  isAuthDisabled()
    ? Effect.succeed(AUTH_DISABLED_SESSION)
    : Effect.gen(function* (_) {
        yield* _(assertSameOrigin(request))
        const token = request.cookies.get(SESSION_COOKIE)?.value
        if (!token) return yield* _(accessError(401, 'Sign in first'))

        const passkey = yield* _(findSessionPasskey(token))
        return yield* _(
          passkey,
          Option.match({
            onNone: () =>
              Effect.fail(
                accessError(401, 'Your session ended. Sign in again.')
              ),
            onSome: ({label, sections}) => Effect.succeed({label, sections}),
          })
        )
      })

export const requireSessionSection = (
  request: NextRequest,
  section: BackofficeSection
): Effect.Effect<
  BackofficeSession,
  AccessRequestError | ConfigError.ConfigError | SqlError,
  PgClient.PgClient
> =>
  Effect.filterOrFail(
    currentSession(request),
    (session) => Array.contains(session.sections, section),
    () => accessError(403, 'You do not have access to this section')
  )

const setCookie = (
  response: NextResponse,
  name: string,
  value: string,
  maxAge: number
): Effect.Effect<NextResponse, ConfigError.ConfigError> =>
  Effect.map(backofficeOriginConfig, (origin) => {
    response.cookies.set(name, value, {
      httpOnly: true,
      sameSite: 'strict',
      secure: origin.protocol === 'https:',
      path: '/',
      maxAge,
    })
    return response
  })

export const setSessionCookie = (
  response: NextResponse,
  token: string
): Effect.Effect<NextResponse, ConfigError.ConfigError> =>
  setCookie(response, SESSION_COOKIE, token, SESSION_LIFETIME_SECONDS)

export const setChallengeCookie = (
  response: NextResponse,
  token: string
): Effect.Effect<NextResponse, ConfigError.ConfigError> =>
  setCookie(response, CHALLENGE_COOKIE, token, CHALLENGE_LIFETIME_SECONDS)

export const clearCookie = (
  response: NextResponse,
  name: string
): Effect.Effect<NextResponse, ConfigError.ConfigError> =>
  setCookie(response, name, '', 0)
