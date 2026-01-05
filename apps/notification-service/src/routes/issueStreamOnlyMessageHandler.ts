import {HttpApiBuilder} from '@effect/platform/index'
import {isVexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {SendingNotificationError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {NotificationSocketMessaging} from '../services/NotificationSocketMessaging'
import {StreamOnlyChatMessageSendTask} from '../services/NotificationSocketMessaging/domain'
import {VexlNotificationTokenService} from '../services/VexlNotificationTokenService'

export const issueStreamOnlyMessageHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'issueStreamOnlyMessage',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const tokenOrCypher =
          req.payload.notificationCypher ?? req.payload.notificationToken
        if (!tokenOrCypher)
          return yield* _(new SendingNotificationError({tokenInvalid: true}))

        const vexlNotificationTokenService = yield* _(
          VexlNotificationTokenService
        )
        const vexlNotificationToken = yield* _(
          vexlNotificationTokenService.normalizeToExpoToken(tokenOrCypher),
          Effect.catchAll(
            () => new SendingNotificationError({tokenInvalid: false})
          )
        )

        const socketMessaging = yield* _(NotificationSocketMessaging)

        yield* _(
          socketMessaging.sendStreamOnlyChatMessage(
            new StreamOnlyChatMessageSendTask({
              notificationToken: vexlNotificationToken,
              targetCypher: tokenOrCypher,
              // TODO #2124
              // Only if the tokenOrCypher is a VexlNotificationToken, we set it as targetToken
              targetToken: isVexlNotificationToken(tokenOrCypher)
                ? tokenOrCypher
                : undefined,
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
