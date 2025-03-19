import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Array, Effect, pipe, Schema} from 'effect'
import {type MessagingTopicResponse} from 'firebase-admin/messaging'
import {UserDbService} from '../../db/UserDbService'
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

export const sendFcmNotificationToAllHandleNonExistingTokens = ({
  data,
  tokens,
  notification,
}: {
  data: Record<string, string>
  notification?:
    | {
        body: string
        title: string
        subtitle?: string | undefined
      }
    | undefined
  tokens: readonly FcmToken[]
}): Effect.Effect<
  IssueNotificationResult[],
  UnexpectedServerError,
  FirebaseMessagingService | UserDbService
> =>
  Effect.gen(function* (_) {
    const userDb = yield* _(UserDbService)
    const results = yield* _(sendNotifications({data, notification, tokens}))

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
    Effect.withSpan('SendFcmNotificationToAllHandleNonExistingTokens')
  )

export const sendNotificationToGeneralTopic = (
  data: Record<string, string>
): Effect.Effect<
  MessagingTopicResponse,
  IssuingNotificationFirebaseError,
  FirebaseMessagingService
> =>
  Effect.gen(function* (_) {
    const messaging = yield* _(FirebaseMessagingService)

    return yield* _(
      Effect.tryPromise({
        try: async () => {
          return await messaging.sendToTopic('general', {
            data,
          })
        },
        catch: (e) =>
          new IssuingNotificationFirebaseError({
            message: 'Error while sending to topic',
            cause: e,
          }),
      })
    )
  }).pipe(
    Effect.withSpan('SendNotificationToGeneralTopic', {attributes: {data}})
  )
