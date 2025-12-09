import {NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {extractPartsOfNotificationCypher} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {
  InvalidFcmCypherError,
  SendingNotificationError,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {type ConfigError, Context, Effect, Layer, Option, Schema} from 'effect'
import {ExpoClientService} from '../ExpoClientService'
import {NotificationMetricsService} from '../metrics'
import {getNotificationContentByLocale} from './utils'

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

const

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

            const systemNotification = {
              token,
              ...getNotificationContentByLocale(metadata.locale),
              data: Schema.encodeSync(NewChatMessageNoticeNotificationData)(
                new NewChatMessageNoticeNotificationData({
                  trackingId: Option.some(trackingId),
                  sentAt: unixMillisecondsNow(),
                  targetCypher,
                  includesSystemNotification: true,
                  systemNotificationSent: Option.some(sendSystemNotification),
                })
              ),
            }

            const backgroundNotification = {
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
            }

            const notificationToSend = [
              ...(sendSystemNotification ? [systemNotification] : []),
              backgroundNotification,
            ]
            yield* _(
              Effect.logInfo('Sending notifications', {
                notificationToSend,
              })
            )
            yield* _(
              Effect.zip(
                expoClient.sendNotification(notificationToSend),
                notificationMetrics.reportNotificationSent({
                  systemNotificationSent: sendSystemNotification,
                  clientPlatform: metadata.clientPlatform,
                  clientVersion: metadata.clientVersion,
                  id: trackingId,
                  sentAt: unixMillisecondsNow(),
                })
              )
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
