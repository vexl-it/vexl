import {Array, Context, Effect, Layer, pipe} from 'effect'
import {Expo, type ExpoPushToken} from 'expo-server-sdk'
import {expoAccessToken} from '../../../../configs'
import {type ExpoSdkError, sendExpoPushNotification} from './utils'

export interface NotificationToSend {
  readonly token: ExpoPushToken
  readonly title?: string
  readonly body?: string
  readonly data: Readonly<Record<string, string>>
}

interface ExpoClientOperations {
  sendNotification: (
    args: NotificationToSend[]
  ) => Effect.Effect<void, ExpoSdkError>
}

export class ExpoClientService extends Context.Tag('ExpoClientService')<
  ExpoClientService,
  ExpoClientOperations
>() {
  static readonly Live = Layer.effect(
    ExpoClientService,
    Effect.gen(function* (_) {
      const expoToken = yield* _(expoAccessToken)
      const expo = new Expo({accessToken: expoToken})

      const sendNotification: ExpoClientOperations['sendNotification'] = (
        notifications
      ) =>
        pipe(
          notifications,
          Array.map((notification) =>
            notification.title && notification.body
              ? {
                  to: notification.token,
                  data: notification.data,
                  title: notification.title,
                  body: notification.body,
                  priority: 'high' as const,
                  _contentAvailable: true,
                }
              : {
                  to: notification.token,
                  data: notification.data,
                  priority: 'high' as const,
                  _contentAvailable: true,
                }
          ),
          (n) => sendExpoPushNotification(expo, n)
        )

      return {
        sendNotification,
      }
    })
  )
}
