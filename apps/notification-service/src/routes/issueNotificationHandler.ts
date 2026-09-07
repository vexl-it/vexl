import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {isVexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  IssueNotificationResponse,
  SendingNotificationError,
} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, pipe} from 'effect'
import {NotificationSocketMessaging} from '../services/NotificationSocketMessaging'
import {NewChatMessageNoticeSendTask} from '../services/NotificationSocketMessaging/domain'
import {OfflineNotificationBuffer} from '../services/OfflineNotificationBuffer'
import {ThrottledPushNotificationService} from '../services/ThrottledPushNotificationService'
import {VexlNotificationTokenService} from '../services/VexlNotificationTokenService'

export const issueNotifcationHandler = makeHttpApiHandler(
  NotificationApiSpecification,
  'root',
  'issueNotification',
  (req) =>
    Effect.gen(function* () {
      const tokenOrCypher =
        req.payload.notificationCypher ?? req.payload.notificationToken
      if (!tokenOrCypher)
        return yield* new SendingNotificationError({tokenInvalid: true})

      const notificationSocketMessaging = yield* NotificationSocketMessaging
      const vexlNotificationTokenService = yield* VexlNotificationTokenService
      const vexlNotificationToken = yield* pipe(
        vexlNotificationTokenService.normalizeToVexlNotificationTokenSecret(
          tokenOrCypher
        ),
        Effect.catchTag(
          'NoSuchElementError',
          (e) => new SendingNotificationError({tokenInvalid: true})
        )
      )

      yield* Effect.log('Processing notification through socket')

      const {issuePushNotification} = yield* ThrottledPushNotificationService
      const offlineNotificationBuffer = yield* OfflineNotificationBuffer

      const task = new NewChatMessageNoticeSendTask({
        notificationToken: vexlNotificationToken,
        targetCypher: tokenOrCypher,
        // TODO #2124
        // Only if the tokenOrCypher is a VexlNotificationToken, we set it as targetToken
        targetToken: isVexlNotificationToken(tokenOrCypher)
          ? tokenOrCypher
          : undefined,
        sendNewChatMessageNotification:
          req.payload.sendNewChatMessageNotification,
        sentAt: unixMillisecondsNow(),
        trackingId: createNotificationTrackingId(),
      })

      // Buffered before the socket attempt - a socket "delivery" only means
      // the message was enqueued for a possibly-dead connection. The entry is
      // removed when the client reports the notification as processed.
      yield* offlineNotificationBuffer.bufferTaskIfEnabled(task)

      yield* Effect.catch(
        notificationSocketMessaging.sendNewChatMessageNotice(task),
        (socketError) =>
          Effect.gen(function* () {
            yield* Effect.log(
              'Unable to send notification via socket, falling back to expo notification',
              socketError
            )
            yield* pipe(
              issuePushNotification(task),
              Effect.catch(
                (pushNotificationError) =>
                  new UnexpectedServerError({
                    message: 'Failed to issue push notification',
                    cause: pushNotificationError,
                  })
              )
            )
          })
      )
      return new IssueNotificationResponse({success: true})
    }).pipe(makeEndpointEffect)
)
