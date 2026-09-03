import {HttpApiBuilder} from '@effect/platform/index'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {IssueNotificationResponse} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {NotificationSocketMessaging} from '../services/NotificationSocketMessaging'
import {NewChatMessageNoticeSendTask} from '../services/NotificationSocketMessaging/domain'
import {findSecretForNotificationToken} from '../services/NotificationTokensDb'
import {OfflineNotificationBuffer} from '../services/OfflineNotificationBuffer'
import {ThrottledPushNotificationService} from '../services/ThrottledPushNotificationService'

export const issueNotifcationHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueNotification',
  (req) =>
    Effect.gen(function* (_) {
      const {notificationToken} = req.payload
      const notificationSocketMessaging = yield* _(NotificationSocketMessaging)
      const secret = yield* _(findSecretForNotificationToken(notificationToken))

      yield* _(Effect.log('Processing notification through socket'))

      const {issuePushNotification} = yield* _(ThrottledPushNotificationService)
      const offlineNotificationBuffer = yield* _(OfflineNotificationBuffer)

      const task = new NewChatMessageNoticeSendTask({
        notificationToken: secret,
        targetToken: notificationToken,
        sendNewChatMessageNotification:
          req.payload.sendNewChatMessageNotification,
        sentAt: unixMillisecondsNow(),
        trackingId: createNotificationTrackingId(),
      })

      // Buffered before the socket attempt - a socket "delivery" only means
      // the message was enqueued for a possibly-dead connection. The entry is
      // removed when the client reports the notification as processed.
      yield* _(offlineNotificationBuffer.bufferTaskIfEnabled(task))

      yield* _(
        Effect.catchAll(
          notificationSocketMessaging.sendNewChatMessageNotice(task),
          (socketError) =>
            Effect.gen(function* (_) {
              yield* _(
                Effect.log(
                  'Unable to send notification via socket, falling back to expo notification',
                  socketError
                )
              )
              yield* _(
                issuePushNotification(task),
                Effect.catchAll(
                  (pushNotificationError) =>
                    new UnexpectedServerError({
                      message: 'Failed to issue push notification',
                      cause: pushNotificationError,
                    })
                )
              )
            })
        )
      )
      return new IssueNotificationResponse({success: true})
    }).pipe(makeEndpointEffect)
)
