import {type PgClient} from '@effect/sql-pg'
import {type SqlError} from '@effect/sql/SqlError'
import {type ConfigError, Effect, Option} from 'effect'
import {type NextRequest, type NextResponse} from 'next/server'
import {jsonOk} from '../http'
import {accessError, type AccessRequestError} from './errors'
import {
  type ChallengePurpose,
  consumeChallenge,
  createSession,
  saveChallenge,
  type SignedInPasskey,
  type StoredChallenge,
} from './repository'
import {
  CHALLENGE_COOKIE,
  clearCookie,
  setChallengeCookie,
  setSessionCookie,
} from './session'

type Handler<A> = Effect.Effect<
  A,
  AccessRequestError | ConfigError.ConfigError | SqlError,
  PgClient.PgClient
>

/** Answers with WebAuthn options and remembers their challenge server-side. */
export const respondWithChallenge = (
  options: {readonly challenge: string},
  purpose: ChallengePurpose
): Handler<NextResponse> =>
  Effect.flatMap(saveChallenge(options.challenge, purpose), (token) =>
    setChallengeCookie(jsonOk(options), token)
  )

export const takeChallenge = (request: NextRequest): Handler<StoredChallenge> =>
  Effect.gen(function* (_) {
    const token = request.cookies.get(CHALLENGE_COOKIE)?.value
    const challenge = token
      ? yield* _(consumeChallenge(token))
      : Option.none<StoredChallenge>()
    return yield* _(
      challenge,
      Effect.mapError(() =>
        accessError(400, 'This attempt has expired. Please try again.')
      )
    )
  })

/** Starts a session for the passkey and answers with what it may access. */
export const signIn = (passkey: SignedInPasskey): Handler<NextResponse> =>
  Effect.gen(function* (_) {
    const token = yield* _(createSession(passkey.id))
    const response = jsonOk({label: passkey.label, sections: passkey.sections})
    yield* _(setSessionCookie(response, token))
    return yield* _(clearCookie(response, CHALLENGE_COOKIE))
  })
