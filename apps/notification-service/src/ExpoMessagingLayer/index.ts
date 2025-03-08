import {Context, Effect, Layer} from 'effect'
import {Expo, type ExpoPushToken} from 'expo-server-sdk'
import {expoAccessToken} from '../configs'
import {type ExpoSdkError, sendExpoPushNotification} from './utils'

interface ExpoClientOperations {
  sendNotification: (args: {
    token: ExpoPushToken
    title?: string
    body?: string
    data: Record<string, string>
  }) => Effect.Effect<
    Awaited<ReturnType<Expo['sendPushNotificationsAsync']>>,
    ExpoSdkError
  >
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

      // TODO process the notificaiton and check wheter it was delivered!
      const sendNotification: ExpoClientOperations['sendNotification'] = ({
        data,
        token,
        title,
        body,
      }) =>
        sendExpoPushNotification(expo, [
          title && body
            ? {
                to: token,
                data,
                title,
                body,
                priority: 'high',
              }
            : {
                to: token,
                data,
                priority: 'high',
                _contentAvailable: true,
              },
        ])

      return {
        sendNotification,
      }
    })
  )
}
