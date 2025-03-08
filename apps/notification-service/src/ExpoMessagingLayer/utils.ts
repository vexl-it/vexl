import {Effect, Schema} from 'effect'
import {type Expo} from 'expo-server-sdk'

export class ExpoSdkError extends Schema.TaggedError<ExpoSdkError>(
  'ExpoSdkError'
)('ExpoSdkError', {
  cause: Schema.Unknown,
  message: Schema.optional(Schema.String),
}) {}

export const sendExpoPushNotification = (
  expo: Expo,
  args: Parameters<Expo['sendPushNotificationsAsync']>[0]
): Effect.Effect<
  Awaited<ReturnType<Expo['sendPushNotificationsAsync']>>,
  ExpoSdkError
> =>
  Effect.tryPromise({
    try: async () => await expo.sendPushNotificationsAsync(args),
    catch: (error) =>
      new ExpoSdkError({
        cause: error,
        message: 'Error sending expo push notification',
      }),
  })
