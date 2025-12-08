import {HttpApiBuilder} from '@effect/platform/index'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {decryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {
  IssueNotificationResponse,
  SendingNotificationError,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {NewChatMessageNoticeMessage} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {fcmTokenPrivateKeyConfig} from '../configs'
import {NotificationSocketMessaging} from '../NotificationSocketMessaging'
import {ExpoNotificationService} from '../utils'

export const issueNotifcationHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueNotification',
  (req) =>
    Effect.gen(function* (_) {
      const {notificationCypher} = req.payload
      const privateKey = yield* _(fcmTokenPrivateKeyConfig)
      const {expoToken} = yield* _(
        decryptNotificationToken({
          privateKey,
          notificationCypher,
        }),
        Effect.catchAll(
          () => new SendingNotificationError({tokenInvalid: false})
        )
      )

      yield* _(
        Effect.log(
          'Processing notification cypher',
          notificationCypher,
          'First try to push to socket'
        )
      )

      const expoNotifications = yield* _(ExpoNotificationService)

      return yield* _(
        NotificationSocketMessaging,
        Effect.flatMap((socketMessaging) =>
          socketMessaging.sendNewChatMessageNotice(
            expoToken,
            new NewChatMessageNoticeMessage({
              sentAt: unixMillisecondsNow(),
              targetCypher: notificationCypher,
              trackingId: createNotificationTrackingId(),
            }),
            req.payload.sendNewChatMessageNotification
          )
        ),
        Effect.catchAll((e) =>
          Effect.zip(
            Effect.log(
              'Unable to send notification via socket, falling back to expo notification',
              e
            ),
            expoNotifications.sendNotificationViaExpoNotification(
              expoToken,
              notificationCypher,
              req.payload.sendNewChatMessageNotification
            )
          )
        ),
        Effect.zipRight(
          Effect.succeed(new IssueNotificationResponse({success: true}))
        )
      )
    }).pipe(makeEndpointEffect)
)
