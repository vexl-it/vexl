import {Array, Context, Effect, Layer, Option, pipe} from 'effect'
import {Expo, type ExpoPushTicket, type ExpoPushToken} from 'expo-server-sdk'
import {expoAccessToken} from '../configs'
import {ExpoSdkError, sendExpoPushNotification} from './utils'

interface ExpoClientOperations {
  sendNotification: (
    args: Array<{
      token: ExpoPushToken
      title?: string
      body?: string
      data: Record<string, string>
    }>
  ) => Effect.Effect<ExpoPushTicket[], ExpoSdkError>
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

      const sendNotification: ExpoClientOperations['sendNotification'] = (n) =>
        pipe(
          Array.map(n, (notification) =>
            notification.title && notification.body
              ? {
                  to: notification.token,
                  data: notification.data,
                  title: notification.title,
                  body: notification.body,
                  priority: 'high' as const,
                }
              : {
                  to: notification.token,
                  data: notification.data,
                  priority: 'high' as const,
                  _contentAvailable: true,
                }
          ),
          (n) =>
            pipe(
              sendExpoPushNotification(expo, n),
              Effect.tap((tickets) =>
                pipe(
                  tickets,
                  Array.filterMap((ticket) =>
                    ticket.status === 'ok' && ticket.id
                      ? Option.some(ticket.id)
                      : Option.none()
                  ),
                  (ids) =>
                    Array.isNonEmptyArray(ids)
                      ? Effect.tryPromise({
                          try: async () =>
                            await expo.getPushNotificationReceiptsAsync(ids),
                          catch: (error) =>
                            new ExpoSdkError({
                              cause: error,
                              message:
                                'Error checking expo push notification receipts',
                            }),
                        }).pipe(
                          Effect.flatMap((receipts) =>
                            pipe(
                              Object.values(receipts),
                              Array.findFirst(
                                (receipt) => receipt.status === 'error'
                              ),
                              (receiptOption) =>
                                Option.match(receiptOption, {
                                  onNone: () => Effect.void,
                                  onSome: (receipt) =>
                                    Effect.fail(
                                      new ExpoSdkError({
                                        cause: receipt,
                                        message:
                                          receipt.message ??
                                          receipt.details?.error ??
                                          'Expo push notification was not delivered',
                                      })
                                    ),
                                })
                            )
                          )
                        )
                      : Effect.void
                )
              )
            )
        )

      return {
        sendNotification,
      }
    })
  )
}
