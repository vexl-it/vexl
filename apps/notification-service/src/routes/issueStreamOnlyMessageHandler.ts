import {HttpApiBuilder} from '@effect/platform/index'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {NotificationSocketMessaging} from '../services/NotificationSocketMessaging'
import {StreamOnlyChatMessageSendTask} from '../services/NotificationSocketMessaging/domain'
import {findSecretForNotificationToken} from '../services/NotificationTokensDb'

export const issueStreamOnlyMessageHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueStreamOnlyMessage',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {notificationToken} = req.payload
        const secret = yield* _(
          findSecretForNotificationToken(notificationToken)
        )

        const socketMessaging = yield* _(NotificationSocketMessaging)

        yield* _(
          socketMessaging.sendStreamOnlyChatMessage(
            new StreamOnlyChatMessageSendTask({
              notificationToken: secret,
              targetToken: notificationToken,
              message: req.payload.message,
              minimalClientVersion: req.payload.minimalOtherSideVersion,
            })
          ),
          Effect.catchTag('NoActiveSocketConnectionsError', () =>
            Effect.logDebug(
              'No active socket connections, skipping stream only chat message'
            )
          ),
          Effect.tapError((e) =>
            Effect.logError('Failed to send stream only chat message', e)
          ),
          Effect.ignore
        )
        return {}
      })
    )
)
