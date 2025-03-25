import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  type NotificationCypher,
  NotificationCypherE,
} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import * as translations from '@vexl-next/localization/src/translations'
import {decryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {
  InvalidFcmCypherError,
  IssueNotificationErrors,
  IssueNotificationResponse,
  SendingNotificationError,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {IssueNotificationEndpoint} from '@vexl-next/rest-api/src/services/notification/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {type ConfigError, Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import {fcmTokenPrivateKeyConfig} from '../../configs'
import {ExpoClientService} from '../../ExpoMessagingLayer'
import {
  type FirebaseMessagingLayer,
  sendFirebaseMessage,
} from '../../FirebaseMessagingLayer'

function getNotificationContentByLocale(locale: string): {
  title: string
  body: string
} {
  try {
    const lang: any =
      // @ts-expect-error this is fine
      translations[locale] ?? translations.en

    if (
      !lang.messages.fallbackMessage.body ||
      !lang.messages.fallbackMessage.title
    )
      throw new Error('Missing fallback message')
    return {
      title: lang.messages.fallbackMessage.title,
      body: lang.messages.fallbackMessage.body,
    }
  } catch (e) {
    const fallback: any = translations.dev
    return {
      title: fallback.messages.fallbackMessage.title,
      body: fallback.messages.fallbackMessage.body,
    }
  }
}

const processNotificationCypher = (
  notificationCypher: NotificationCypher,
  sendSystemNotification: boolean
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
        notificationCypher,
      }),
      Effect.catchAll(() => new SendingNotificationError({tokenInvalid: false}))
    )

    if (notificationToken.type === 'fcm') {
      const {fcmToken} = notificationToken
      yield* _(
        sendFirebaseMessage({
          token: fcmToken,
          data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
            new NewChatMessageNoticeNotificationData({
              targetCypher: notificationCypher,
              includesSystemNotification: 'false',
            })
          ),
        })
      )

      return new IssueNotificationResponse({success: true})
    } else {
      const expoClient = yield* _(ExpoClientService)

      if (sendSystemNotification) {
        yield* _(
          expoClient.sendNotification({
            token: notificationToken.expoToken,
            ...getNotificationContentByLocale(notificationToken.locale),
            data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
              new NewChatMessageNoticeNotificationData({
                targetCypher: notificationCypher,
                includesSystemNotification: 'true',
              })
            ),
          })
        )
      }

      yield* _(
        expoClient.sendNotification({
          token: notificationToken.expoToken,
          data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
            new NewChatMessageNoticeNotificationData({
              targetCypher: notificationCypher,
              includesSystemNotification: 'false',
            })
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
        const cypherToUse = Schema.decodeUnknownOption(NotificationCypherE)(
          notificationCypher ?? fcmCypher
        )

        if (Option.isNone(cypherToUse)) {
          yield* _(Effect.log('No fcmCypher or notificationCypher provided'))
          return yield* _(Effect.fail(new InvalidFcmCypherError({status: 400})))
        }

        yield* _(
          Effect.log('Processing notification cypher', cypherToUse.value)
        )

        return yield* _(
          processNotificationCypher(
            cypherToUse.value,
            req.body.sendNewChatMessageNotification
          )
        )
      }),
      IssueNotificationErrors
    )
)
