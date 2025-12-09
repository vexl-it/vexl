import {HttpApiBuilder} from '@effect/platform/index'
import {decryptNotificationToken} from '@vexl-next/resources-utils/src/notifications/notificationTokenActions'
import {SendingNotificationError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {fcmTokenPrivateKeyConfig} from '../configs'
import {NotificationSocketMessaging} from '../NotificationSocketMessaging'
import {vexlNotificationTokenFromExpoToken} from '../NotificationSocketMessaging/domain'

export const issueStreamOnlyMessageHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueStreamOnlyMessage',
  (req) =>
    makeEndpointEffect(
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

        const socketMessaging = yield* _(NotificationSocketMessaging)

        yield* _(
          socketMessaging.sendStreamOnlyChatMessage(
            vexlNotificationTokenFromExpoToken(expoToken),
            req.payload.message,
            notificationCypher,
            {minimalClientVersion: req.payload.minimalOtherSideVersion}
          ),
          Effect.ignore
        )
        return {}
      })
    )
)
