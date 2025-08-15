import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {
  type NotificationCypher,
  NotificationCypherE,
} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
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
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {type ConfigError, Effect, Option, Schema} from 'effect'
import {Handler} from 'effect-http'
import {fcmTokenPrivateKeyConfig} from '../../configs'
import {ExpoClientService} from '../../ExpoMessagingLayer'
import {
  type FirebaseMessagingLayer,
  sendFirebaseMessage,
} from '../../FirebaseMessagingLayer'
import {reportNotificationSent} from '../../metrics'

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
  FirebaseMessagingLayer | ExpoClientService | MetricsClientService
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
              trackingId: Option.none(),
              targetCypher: notificationCypher,
              sentAt: unixMillisecondsNow(),
              includesSystemNotification: 'false',
            })
          ),
        })
      )

      return new IssueNotificationResponse({success: true})
    } else {
      const expoClient = yield* _(ExpoClientService)
      const expoToken = notificationToken.expoToken

      const locale =
        notificationToken.type === 'expoV2'
          ? notificationToken.data.locale
          : notificationToken.locale

      const trackingId = createNotificationTrackingId()
      if (notificationToken.type === 'expoV2')
        yield* _(
          reportNotificationSent({
            clientPlatform: notificationToken.data.clientPlatform,
            clientVersion: notificationToken.data.clientVersion,
            id: trackingId,
            sentAt: unixMillisecondsNow(),
          })
        )

      if (sendSystemNotification) {
        yield* _(
          expoClient.sendNotification({
            token: expoToken,
            ...getNotificationContentByLocale(locale),
            data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
              new NewChatMessageNoticeNotificationData({
                trackingId:
                  notificationToken.type === 'expoV2'
                    ? Option.some(trackingId)
                    : Option.none(),
                sentAt: unixMillisecondsNow(),
                targetCypher: notificationCypher,
                includesSystemNotification: 'true',
              })
            ),
          })
        )
      }

      yield* _(
        expoClient.sendNotification({
          token: expoToken,
          data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
            new NewChatMessageNoticeNotificationData({
              trackingId:
                notificationToken.type === 'expoV2'
                  ? Option.some(trackingId)
                  : Option.none(),
              sentAt: unixMillisecondsNow(),
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
