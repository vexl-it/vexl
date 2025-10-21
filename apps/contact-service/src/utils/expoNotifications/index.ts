import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  ExpoNotificationTokenE,
  type ExpoNotificationToken,
} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {Array, Effect, pipe, Schema} from 'effect'
import {isNotUndefined} from 'effect/Predicate'
import {type ExpoPushMessage, type ExpoPushTicket} from 'expo-server-sdk'
import {UserDbService} from '../../db/UserDbService'
import {
  ExpoNotificationsService,
  type ErrorBatchingPushNotifications,
  type ErrorSendingPushNotifications,
} from './ExpoNotificationsService'

export const sendPushNotificationExpo = ({
  data,
  tokens,
  notification,
}: {
  data: Record<string, unknown>
  notification?:
    | {
        body: string
        title: string
        subtitle?: string | undefined
      }
    | undefined
  tokens: ExpoNotificationToken[]
}): Effect.Effect<
  ExpoPushTicket[],
  ErrorBatchingPushNotifications | ErrorSendingPushNotifications,
  ExpoNotificationsService
> =>
  Effect.gen(function* (_) {
    const expoNotifications = yield* _(ExpoNotificationsService)

    const messages = Array.map(
      tokens,
      (to) =>
        (notification
          ? {
              to,
              data,
              title: notification.title,
              body: notification.body,
              subtitle: notification.subtitle,
            }
          : {
              to,
              data,
              priority: 'high',
              _contentAvailable: true,
            }) satisfies ExpoPushMessage
    )

    return yield* _(
      expoNotifications.chunkPushNotifications(messages),
      Effect.flatMap(Effect.forEach(expoNotifications.sendNotifications)),
      Effect.map(Array.flatten)
    )
  })

export const sendExpoNotificationToAllHandleNonExistingTokens = ({
  data,
  tokens,
}: {
  data: Record<string, unknown>
  notification?:
    | {
        body: string
        title: string
        subtitle?: string | undefined
      }
    | undefined
  tokens: ExpoNotificationToken[]
}): Effect.Effect<
  ExpoPushTicket[],
  UnexpectedServerError,
  ExpoNotificationsService | UserDbService
> =>
  Effect.gen(function* (_) {
    const userDb = yield* _(UserDbService)
    const results = yield* _(sendPushNotificationExpo({data, tokens}))

    const decodeNotificationToken = Schema.decodeSync(ExpoNotificationTokenE)

    const invalidTokens = pipe(
      results,
      Array.filter(
        (one): one is typeof one & {status: 'error'} =>
          one.status === 'error' && one.details?.error === 'DeviceNotRegistered'
      ),
      Array.map((one) => one.details?.expoPushToken),
      Array.filter(isNotUndefined),
      Array.map((t) => decodeNotificationToken(t))
    )

    yield* _(
      Effect.forEach(invalidTokens, userDb.updateInvalidateExpoToken, {
        batching: true,
      })
    )
    // TODO update invalidate club members tokens
    return results
  }).pipe(
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('ErrorIssuingExpoNotification', {e}),
        Effect.fail(
          new UnexpectedServerError({
            cause: e,
            status: 500,
            message: e.message,
          })
        )
      )
    ),
    Effect.withSpan('SendExpoNotificationToAllHandleNonExistingTokens')
  )
