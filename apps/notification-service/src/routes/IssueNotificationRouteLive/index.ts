import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  type NotificationCypher,
  NotificationCypherE,
} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {decryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {
  InvalidFcmCypherError,
  IssueNotificationErrors,
  IssueNotificationResponse,
  SendingNotificationError,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {IssueNotificationEndpoint} from '@vexl-next/rest-api/src/services/notification/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {type ConfigError, Effect, Schema} from 'effect'
import {Handler} from 'effect-http'
import {fcmTokenPrivateKeyConfig} from '../../configs'
import {ExpoClientService} from '../../ExpoMessagingLayer'
import {
  type FirebaseMessagingLayer,
  sendFirebaseMessage,
} from '../../FirebaseMessagingLayer'

const processNotificationCypher = (
  notificationCypher: NotificationCypher
): Effect.Effect<
  IssueNotificationResponse,
  InvalidFcmCypherError | ConfigError.ConfigError | SendingNotificationError,
  FirebaseMessagingLayer | ExpoClientService
> =>
  Effect.gen(function* (_) {
    const privateKey = yield* _(fcmTokenPrivateKeyConfig)
    const notificationToken = yield* _(
      decryptNotificationToken({
        privateKey,
        cypher: notificationCypher,
      }),
      Effect.catchAll(() => new SendingNotificationError({tokenInvalid: false}))
    )

    const chatNotificationData = new NewChatMessageNoticeNotificationData({
      targetCypher: notificationCypher,
    })

    if (notificationToken.type === 'fcm') {
      const {fcmToken} = notificationToken
      yield* _(
        sendFirebaseMessage({
          token: fcmToken,
          data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
            chatNotificationData
          ),
        })
      )

      return new IssueNotificationResponse({success: true})
    } else {
      const expoClient = yield* _(ExpoClientService)
      yield* _(
        expoClient.sendNotification({
          token: notificationToken.expoToken,
          data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
            chatNotificationData
          ),
        })
      )
    }

    return new IssueNotificationResponse({success: true})
  }).pipe(
    Effect.catchTag(
      'ExpoSdkError',
      () => new SendingNotificationError({tokenInvalid: false, status: 400})
    )
  )

export const IssueNotifcationHandler = Handler.make(
  IssueNotificationEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {fcmCypher, notificationCypher} = req.body

        if (!fcmCypher || !notificationCypher) {
          yield* _(Effect.log('No fcmCypher or notificationCypher provided'))
          return yield* _(Effect.fail(new InvalidFcmCypherError({status: 400})))
        }

        const cypherToUse =
          notificationCypher ??
          Schema.decodeSync(NotificationCypherE)(fcmCypher)

        return yield* _(processNotificationCypher(cypherToUse))
      }),
      IssueNotificationErrors
    )
)
