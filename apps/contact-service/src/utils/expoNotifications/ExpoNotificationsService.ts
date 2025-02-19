import {Context, Effect, Layer, Schema} from 'effect'
import {Expo, type ExpoPushMessage, type ExpoPushTicket} from 'expo-server-sdk'
import {expoAccessToken} from '../../configs'

export class ExpoInitializationError extends Schema.TaggedError<ExpoInitializationError>(
  'ExpoInitializationError'
)('ExpoInitializationError', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export class ErrorSendingPushNotifications extends Schema.TaggedError<ErrorSendingPushNotifications>(
  'ErrorSendingPushNotifications'
)('ErrorSendingPushNotifications', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export class ErrorBatchingPushNotifications extends Schema.TaggedError<ErrorBatchingPushNotifications>(
  'ErrorBatchingPushNotifications'
)('ErrorBatchingPushNotifications', {
  cause: Schema.Unknown,
  message: Schema.String,
}) {}

export interface ExpoNotificationsOperations {
  sendNotifications: (
    messages: ExpoPushMessage[]
  ) => Effect.Effect<ExpoPushTicket[], ErrorSendingPushNotifications>
  chunkPushNotifications: (
    a: ExpoPushMessage[]
  ) => Effect.Effect<ExpoPushMessage[][], ErrorBatchingPushNotifications>
}

const createExpoMessagaging = (
  token: string
): Effect.Effect<ExpoNotificationsOperations, ExpoInitializationError> =>
  Effect.gen(function* (_) {
    const expo = new Expo({
      accessToken: token,
    })

    const sendNotifications: ExpoNotificationsOperations['sendNotifications'] =
      (messages) =>
        Effect.tryPromise({
          try: async () => await expo.sendPushNotificationsAsync(messages),
          catch: (error) =>
            new ErrorSendingPushNotifications({
              cause: error,
              message: 'Error sending push notifications',
            }),
        })
    const chunkPushNotifications: ExpoNotificationsOperations['chunkPushNotifications'] =
      (messages) =>
        Effect.try({
          try: () => expo.chunkPushNotifications(messages),
          catch: (error) =>
            new ErrorBatchingPushNotifications({
              cause: error,
              message: 'Error chunking push notifications',
            }),
        })

    return {
      sendNotifications,
      chunkPushNotifications,
    }
  }).pipe(
    Effect.catchAllDefect(
      (defect) =>
        new ExpoInitializationError({
          cause: defect,
          message: 'Unknown expo intialization error',
        })
    )
  )

export class ExpoNotificationsService extends Context.Tag(
  'ExpoNotificationsService'
)<ExpoNotificationsService, ExpoNotificationsOperations>() {
  static readonly Live = Layer.effect(
    ExpoNotificationsService,
    expoAccessToken.pipe(Effect.flatMap(createExpoMessagaging))
  )
}
