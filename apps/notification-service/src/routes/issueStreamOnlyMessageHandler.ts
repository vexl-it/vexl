import {HttpApiBuilder} from '@effect/platform/index'
import {decryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {SendingNotificationError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {fcmTokenPrivateKeyConfig} from '../configs'
import {NotificationSocketMessaging} from '../services/NotificationSocketMessaging'
import {
  StreamOnlyChatMessageSendTask,
  vexlNotificationTokenFromExpoToken,
} from '../services/NotificationSocketMessaging/domain'

export const issueStreamOnlyMessageHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueStreamOnlyMessage',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {notificationCypher} = req.payload
        const privateKey = yield* _(fcmTokenPrivateKeyConfig)
        const socketMessaging = yield* _(NotificationSocketMessaging)

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
          socketMessaging.sendStreamOnlyChatMessage(
            new StreamOnlyChatMessageSendTask({
              notificationToken: vexlNotificationTokenFromExpoToken(expoToken),
              targetCypher: notificationCypher,
              message: req.payload.message,
              minimalClientVersion: req.payload.minimalOtherSideVersion,
            })
          ),
          Effect.ignore
        )
        return {}
      })
    )
)
