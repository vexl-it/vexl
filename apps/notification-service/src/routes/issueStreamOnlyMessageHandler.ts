import {isVexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {SendingNotificationError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {Effect, pipe} from 'effect'
import {NotificationSocketMessaging} from '../services/NotificationSocketMessaging'
import {StreamOnlyChatMessageSendTask} from '../services/NotificationSocketMessaging/domain'
import {VexlNotificationTokenService} from '../services/VexlNotificationTokenService'

export const issueStreamOnlyMessageHandler = makeHttpApiHandler(
  NotificationApiSpecification,
  'root',
  'issueStreamOnlyMessage',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const tokenOrCypher =
          req.payload.notificationCypher ?? req.payload.notificationToken
        if (!tokenOrCypher)
          return yield* new SendingNotificationError({tokenInvalid: true})

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
        // const vexlNotificationToken = yield* _(
        //   vexlNotificationTokenService.normalizeToExpoToken(tokenOrCypher),
        //   Effect.catchAll(
        //     () => new SendingNotificationError({tokenInvalid: false})
        //   )
        // )

        const socketMessaging = yield* NotificationSocketMessaging

        yield* pipe(
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
