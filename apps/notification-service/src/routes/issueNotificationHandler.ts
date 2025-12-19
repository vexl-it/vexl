import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {decryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {
  IssueNotificationResponse,
  SendingNotificationError,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {fcmTokenPrivateKeyConfig} from '../configs'
import {NotificationSocketMessaging} from '../services/NotificationSocketMessaging'
import {
  NewChatMessageNoticeSendTask,
  vexlNotificationTokenFromExpoToken,
} from '../services/NotificationSocketMessaging/domain'
import {ThrottledPushNotificationService} from '../services/ThrottledPushNotificationService'

export const issueNotifcationHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueNotification',
  (req) =>
    Effect.gen(function* (_) {
      const {notificationCypher} = req.payload
      const privateKey = yield* _(fcmTokenPrivateKeyConfig)
      const notificationSocketMessaging = yield* _(NotificationSocketMessaging)

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

      const {issuePushNotification} = yield* _(ThrottledPushNotificationService)

      const task = new NewChatMessageNoticeSendTask({
        notificationToken: vexlNotificationTokenFromExpoToken(expoToken),
        targetCypher: notificationCypher,
        sendNewChatMessageNotification:
          req.payload.sendNewChatMessageNotification,
        sentAt: unixMillisecondsNow(),
        trackingId: createNotificationTrackingId(),
      })

      yield* _(
        Effect.catchAll(
          notificationSocketMessaging.sendNewChatMessageNotice(task),
          (e) =>
            Effect.zip(
              Effect.log(
                'Unable to send notification via socket, falling back to expo notification',
                e
              ),
              issuePushNotification(task).pipe(
                Effect.catchAll(
                  (e) =>
                    new UnexpectedServerError({
                      message: 'Failed to issue push notification',
                      cause: e,
                    })
                )
              )
            )
        )
      )
      return new IssueNotificationResponse({success: true})
    }).pipe(makeEndpointEffect)
)
