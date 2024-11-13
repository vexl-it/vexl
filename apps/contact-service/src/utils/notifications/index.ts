import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Array, Effect, pipe, Schema} from 'effect'
import {type MessagingTopicResponse} from 'firebase-admin/messaging'
import {UserDbService} from '../../db/UserDbService'
import {createFirebaseNotificationRequest} from './createFirebaseNotificationRequestBase'
import {IssuingNotificationFirebaseError} from './domain'
import {FirebaseMessagingService} from './FirebaseMessagingService'
import {
  sendNotifications,
  type IssueNotificationResult,
} from './sendNotificationUnsafe'

export class ErrorIssuingFirebaseNotification extends Schema.TaggedError<ErrorIssuingFirebaseNotification>(
  'ErrorIssuingFirebaseNotification'
)('ErrorIssuingFirebaseNotification', {
  cause: Schema.optional(Schema.Unknown),
  firebaseErrorCode: Schema.optional(Schema.String),
  isCausedByInvalidToken: Schema.optionalWith(Schema.Boolean, {
    default: () => false,
  }),
  message: Schema.String,
}) {}

export const sendNotificationToAllHandleNonExistingTokens = ({
  type,
  tokens,
}: {
  type: string
  tokens: readonly FcmToken[]
}): Effect.Effect<
  IssueNotificationResult[],
  UnexpectedServerError,
  FirebaseMessagingService | UserDbService
> =>
  Effect.gen(function* (_) {
    const userDb = yield* _(UserDbService)
    const results = yield* _(sendNotifications({type, tokens}))

    const invalidTokens = pipe(
      results,
      Array.filter((one) => !one.success && one.error.isCausedByInvalidToken),
      Array.map((one) => one.token)
    )

    yield* _(
      Effect.forEach(invalidTokens, userDb.updateInvalidateFirebaseToken, {
        batching: true,
      })
    )

    return results
  }).pipe(
    Effect.catchTag('IssuingNotificationUnexpectedError', (e) =>
      Effect.zipRight(
        Effect.logError('ErrorIssuingFirebaseNotification', {e}),
        Effect.fail(
          new UnexpectedServerError({
            cause: e,
            status: 500,
            detail: e.message,
          })
        )
      )
    ),
    Effect.withSpan('SendNotificationToAllHandleNonExistingTokens')
  )

export const sendNotificationToGeneralTopic = (
  type: string
): Effect.Effect<
  MessagingTopicResponse,
  IssuingNotificationFirebaseError,
  FirebaseMessagingService
> =>
  Effect.gen(function* (_) {
    const messaging = yield* _(FirebaseMessagingService)

    return yield* _(
      Effect.tryPromise({
        try: async () =>
          await messaging.sendToTopic(
            'general',
            createFirebaseNotificationRequest(type)
          ),
        catch: (e) =>
          new IssuingNotificationFirebaseError({
            message: 'Error while sending to topic',
            cause: e,
          }),
      })
    )
  }).pipe(
    Effect.withSpan('SendNotificationToGeneralTopic', {attributes: {type}})
  )
