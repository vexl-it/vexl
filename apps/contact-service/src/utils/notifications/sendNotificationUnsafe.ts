import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Array, Effect, Schema} from 'effect'
import {FirebaseMessagingService} from './FirebaseMessagingService'
import {createFirebaseNotificationRequest} from './createFirebaseNotificationRequestBase'
import {
  IssuingNotificationFirebaseError,
  IssuingNotificationUnexpectedError,
} from './domain'

export type IssueNotificationResult =
  | {
      token: FcmToken
      success: true
    }
  | {
      token: FcmToken
      success: false
      error: IssuingNotificationFirebaseError
    }

export class ArgumentOutOfBoundsError extends Schema.TaggedError<ArgumentOutOfBoundsError>(
  'ArgumentOutOfBoundsError'
)('ArgumentOutOfBoundsError', {}) {}

/**
 * !! Accepts max 500 requests. Should not be used directly.
 *
 * @param requests Max 500 messages
 * @returns
 */
const sendNotificationBatchUnsafe = ({
  type,
  tokens,
}: {
  type: string
  tokens: FcmToken[]
}): Effect.Effect<
  IssueNotificationResult[],
  IssuingNotificationUnexpectedError,
  FirebaseMessagingService
> =>
  Effect.gen(function* (_) {
    const messaging = yield* _(FirebaseMessagingService)

    const response = yield* _(
      Effect.tryPromise({
        try: async () =>
          await messaging.sendEachForMulticast({
            ...createFirebaseNotificationRequest(type),
            tokens,
          }),
        catch: (e) =>
          new IssuingNotificationUnexpectedError({
            message: 'Error while sending batch',
            cause: e,
          }),
      })
    )
    return Array.zipWith(tokens, response.responses, (token, result) => {
      if (result.success) {
        return {
          token,
          success: true as const,
        }
      }
      return {
        token,
        success: false as const,
        error: new IssuingNotificationFirebaseError({
          firebaseErrorCode: result.error?.code ?? 'unknown',
          message: result.error?.message ?? 'Unknown error sending message',
          cause: result.error,
          isCausedByInvalidToken:
            result.error?.code === 'messaging/unregistered',
        }),
      }
    })
  }).pipe(
    Effect.withSpan('Issuing notification batch', {
      attributes: {tokensLength: tokens.length, type},
    })
  )

export const sendNotifications = ({
  type,
  tokens,
}: {
  type: string
  tokens: readonly FcmToken[]
}): Effect.Effect<
  IssueNotificationResult[],
  IssuingNotificationUnexpectedError,
  FirebaseMessagingService
> =>
  Effect.gen(function* (_) {
    const batches = Array.chunksOf(tokens, 500)
    const results = yield* _(
      Effect.forEach(batches, (batch) =>
        sendNotificationBatchUnsafe({type, tokens: batch})
      )
    )
    return Array.flatten(results)
  })
