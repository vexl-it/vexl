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
  data,
  tokens,
  notification,
}: {
  data: Record<string, string>
  tokens: FcmToken[]
  notification?:
    | {
        body: string
        title: string
        subtitle?: string | undefined
      }
    | undefined
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
            ...createFirebaseNotificationRequest(data, notification),
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
            result.error?.code === 'messaging/unregistered' ||
            result.error?.code ===
              'messaging/registration-token-not-registered',
        }),
      }
    })
  }).pipe(
    Effect.withSpan('Issuing notification batch', {
      attributes: {tokensLength: tokens.length, data},
    })
  )

export const sendNotifications = ({
  data,
  tokens,
  notification,
}: {
  data: Record<string, string>
  tokens: readonly FcmToken[]
  notification?:
    | {
        body: string
        title: string
        subtitle?: string | undefined
      }
    | undefined
}): Effect.Effect<
  IssueNotificationResult[],
  IssuingNotificationUnexpectedError,
  FirebaseMessagingService
> =>
  Effect.gen(function* (_) {
    const batches = Array.chunksOf(tokens, 500)
    const results = yield* _(
      Effect.forEach(batches, (batch) =>
        sendNotificationBatchUnsafe({data, tokens: batch, notification})
      )
    )
    return Array.flatten(results)
  })
