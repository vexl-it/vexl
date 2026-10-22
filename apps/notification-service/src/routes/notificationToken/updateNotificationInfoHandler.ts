import {HttpApiBuilder} from '@effect/platform/index'
import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {MissingCommonHeadersError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {
  EnqueueUserNotification,
  type EnqueueUserNotificationContext,
  UserLoginOnDifferentDeviceNotificationMqEntry,
} from '@vexl-next/server-utils/src/UserNotificationMq'
import {Effect, Option} from 'effect'
import {NotificationSocketMessaging} from '../../services/NotificationSocketMessaging'
import {UserLoginOnDifferentDeviceNoticeSendTask} from '../../services/NotificationSocketMessaging/domain'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'

export const updateNotificationInfoHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'NotificationTokenGroup',
  'updateNoficationInfo',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const {payload, headers} = req

        const {clientPlatform, clientVersion, clientAppSource, language} =
          yield* _(
            Option.all({
              clientPlatform: headers.clientPlatformOrNone,
              clientVersion: headers.clientVersionOrNone,
              clientAppSource: headers.appSourceOrNone,
              language: headers.language,
            }),
            Effect.mapError(() => new MissingCommonHeadersError())
          )

        const clientPrefix = Option.getOrNull(headers.prefixOrNone)

        const db = yield* NotificationTokensDb
        const previous = yield* db.findSecretBySecretValue(payload.secret)

        const updated = yield* db.updateClientInfo({
          secretToken: payload.secret,
          expoNotificationToken: payload.expoNotificationToken ?? null,
          systemVexlToken: payload.systemVexlToken ?? null,
          marketingVexlToken: payload.marketingVexlToken ?? null,
          clientLanguage: language,
          clientPlatform,
          clientVersion,
          clientAppSource,
          clientPrefix,
          backgroundSocketEnabled: payload.backgroundSocketEnabled ?? false,
        })

        if (
          Option.isSome(previous) &&
          previous.value.expoNotificationToken !== updated.expoNotificationToken
        ) {
          yield* nudgeDevicesToCheckTheirSession({
            secret: updated.secret,
            previousExpoToken: previous.value.expoNotificationToken,
          })
        }
      })
    )
)

/**
 * A restore on another device takes over the secret, which changes its expo
 * token. The replaced device would only notice on its next resume, so it is
 * asked to check right away - over its old push token and over any open
 * stream. A device that wasn't replaced finds nothing.
 */
const nudgeDevicesToCheckTheirSession = ({
  secret,
  previousExpoToken,
}: {
  secret: VexlNotificationTokenSecret
  previousExpoToken: ExpoNotificationToken | null
}): Effect.Effect<
  void,
  never,
  NotificationSocketMessaging | EnqueueUserNotificationContext
> =>
  Effect.gen(function* (_) {
    const socketMessaging = yield* _(NotificationSocketMessaging)
    yield* _(
      socketMessaging.sendNotice(
        new UserLoginOnDifferentDeviceNoticeSendTask({
          notificationToken: secret,
          targetToken: null,
          accountMoved: true,
        })
      ),
      Effect.catchTag('NoActiveSocketConnectionsError', () => Effect.void),
      Effect.catchAll((e) =>
        Effect.logWarning(
          'Failed to nudge open streams about a moved account',
          e
        )
      )
    )

    if (previousExpoToken === null) return
    const enqueue = yield* _(EnqueueUserNotification)
    yield* _(
      enqueue(
        new UserLoginOnDifferentDeviceNotificationMqEntry({
          notificationToken: previousExpoToken,
          token: null,
          accountMoved: true,
        }),
        {delay: 0}
      ),
      Effect.catchAll((e) =>
        Effect.logWarning('Failed to nudge the replaced device', e)
      )
    )
  })
