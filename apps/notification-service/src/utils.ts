import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import * as translations from '@vexl-next/localization/src/translations'
import {extractPartsOfNotificationCypher} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {
  InvalidFcmCypherError,
  SendingNotificationError,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {type ConfigError, Context, Effect, Layer, Option, Schema} from 'effect'
import {ExpoClientService} from './ExpoMessagingLayer'
import {NotificationMetricsService} from './metrics'

export function getNotificationContentByLocale(locale: string): {
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

export interface ExpoNotificationServiceOperations {
  sendNotificationViaExpoNotification: (
    token: ExpoNotificationToken,
    targetCypher: NotificationCypher,
    sendSystemNotification: boolean
  ) => Effect.Effect<
    void,
    ConfigError.ConfigError | SendingNotificationError | InvalidFcmCypherError
  >
}

export class ExpoNotificationService extends Context.Tag(
  'ExpoNotificationService'
)<ExpoNotificationService, ExpoNotificationServiceOperations>() {
  static Live = Layer.effect(
    ExpoNotificationService,
    Effect.gen(function* (_) {
      const expoClient = yield* _(ExpoClientService)
      const notificationMetrics = yield* _(NotificationMetricsService)

      return {
        sendNotificationViaExpoNotification: (
          token: ExpoNotificationToken,
          targetCypher: NotificationCypher,
          sendSystemNotification: boolean
        ) =>
          Effect.gen(function* (_) {
            yield* _(Effect.logInfo('Sending notification'))

            const {data: metadata} = yield* _(
              extractPartsOfNotificationCypher({
                notificationCypher: targetCypher,
              }),
              Effect.catchTag(
                'NoSuchElementException',
                () => new InvalidFcmCypherError()
              )
            )

            const trackingId = createNotificationTrackingId()
            yield* _(
              notificationMetrics.reportNotificationSent({
                systemNotificationSent: sendSystemNotification,
                clientPlatform: metadata.clientPlatform,
                clientVersion: metadata.clientVersion,
                id: trackingId,
                sentAt: unixMillisecondsNow(),
              })
            )

            if (sendSystemNotification) {
              yield* _(Effect.logInfo('Sending expo system notification'))

              yield* _(
                expoClient.sendNotification({
                  token,
                  ...getNotificationContentByLocale(metadata.locale),
                  data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
                    new NewChatMessageNoticeNotificationData({
                      trackingId: Option.some(trackingId),
                      sentAt: unixMillisecondsNow(),
                      targetCypher,
                      includesSystemNotification: true,
                      systemNotificationSent: Option.some(
                        sendSystemNotification
                      ),
                    })
                  ),
                })
              )
            }
            yield* _(Effect.logInfo('Sending expo notification'))

            yield* _(
              expoClient.sendNotification({
                token,
                data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
                  new NewChatMessageNoticeNotificationData({
                    trackingId: Option.some(trackingId),
                    sentAt: unixMillisecondsNow(),
                    targetCypher,
                    includesSystemNotification: false,
                    systemNotificationSent: Option.some(sendSystemNotification),
                  })
                ),
              })
            )
          }).pipe(
            Effect.withSpan('processNotificationCypher', {
              attributes: {targetCypher, sendSystemNotification},
            }),
            Effect.catchTag(
              'ExpoSdkError',
              () =>
                new SendingNotificationError({tokenInvalid: false, status: 400})
            )
          ),
      }
    })
  )
}
