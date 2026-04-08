import {
  type UnexpectedServerError,
  UnexpectedServerError as UnexpectedServerErrorClass,
} from '@vexl-next/domain/src/general/commonErrors'
import {TurnstileVerificationError} from '@vexl-next/rest-api/src/services/user/contracts'
import {Context, Effect, Layer, Option, Schema} from 'effect/index'
import {
  turnstileExpectedHostnameConfig,
  turnstileSecretKeyConfig,
} from '../configs'

const TurnstileVerificationResponse = Schema.Struct({
  success: Schema.Boolean,
  hostname: Schema.optional(Schema.String),
  action: Schema.optional(Schema.String),
  'error-codes': Schema.optional(Schema.Array(Schema.String)),
})

type TurnstileVerificationResponse = typeof TurnstileVerificationResponse.Type

export interface TurnstileOperations {
  verifyToken: (args: {
    expectedAction: string
    token: string
  }) => Effect.Effect<void, TurnstileVerificationError | UnexpectedServerError>
}

const makeUnexpectedServerError = (
  message: string,
  cause: unknown
): UnexpectedServerError =>
  new UnexpectedServerErrorClass({
    status: 500,
    message,
    cause,
  })

const verifyResponse = ({
  expectedAction,
  expectedHostname,
  result,
}: {
  expectedAction: string
  expectedHostname: Option.Option<string>
  result: TurnstileVerificationResponse
}): Effect.Effect<void, TurnstileVerificationError> => {
  if (!result.success) {
    return Effect.fail(
      new TurnstileVerificationError({
        status: 400,
        reason: 'InvalidToken',
      })
    )
  }

  if (
    Option.isSome(expectedHostname) &&
    result.hostname !== expectedHostname.value
  ) {
    return Effect.fail(
      new TurnstileVerificationError({
        status: 400,
        reason: 'HostnameMismatch',
      })
    )
  }

  if (result.action !== expectedAction) {
    return Effect.fail(
      new TurnstileVerificationError({
        status: 400,
        reason: 'ActionMismatch',
      })
    )
  }

  return Effect.void
}

export class TurnstileService extends Context.Tag('TurnstileService')<
  TurnstileService,
  TurnstileOperations
>() {
  static readonly Live = Layer.effect(
    TurnstileService,
    Effect.gen(function* (_) {
      const turnstileSecretKey = yield* _(turnstileSecretKeyConfig)
      const expectedHostname = yield* _(turnstileExpectedHostnameConfig)

      const verifyToken: TurnstileOperations['verifyToken'] = ({
        expectedAction,
        token,
      }) => {
        if (Option.isNone(turnstileSecretKey)) {
          return Effect.void
        }

        if (token.length === 0) {
          return Effect.fail(
            new TurnstileVerificationError({
              status: 400,
              reason: 'MissingToken',
            })
          )
        }

        return Effect.tryPromise({
          try: async () => {
            const body = new URLSearchParams({
              secret: turnstileSecretKey.value,
              response: token,
              idempotency_key: globalThis.crypto.randomUUID(),
            })

            const response = await fetch(
              'https://challenges.cloudflare.com/turnstile/v0/siteverify',
              {
                body,
                headers: {
                  'content-type': 'application/x-www-form-urlencoded',
                },
                method: 'POST',
              }
            )

            if (!response.ok) {
              throw new Error(
                `Turnstile responded with status ${response.status}`
              )
            }

            return await response.json()
          },
          catch: (error) =>
            makeUnexpectedServerError(
              'Failed to verify Turnstile token',
              error
            ),
        }).pipe(
          Effect.flatMap((response) =>
            Schema.decodeUnknown(TurnstileVerificationResponse)(response).pipe(
              Effect.mapError((error) =>
                makeUnexpectedServerError(
                  'Invalid Turnstile verification response',
                  error
                )
              )
            )
          ),
          Effect.flatMap((result) =>
            verifyResponse({expectedAction, expectedHostname, result})
          ),
          Effect.withSpan('verifyTurnstileToken', {
            attributes: {expectedAction},
          })
        )
      }

      return {
        verifyToken,
      }
    })
  )
}
