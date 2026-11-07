import {HttpApiBuilder} from '@effect/platform/index'
import {UserLoginOnDifferentDeviceNotificationData} from '@vexl-next/domain/src/general/notifications'
import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {MissingCommonHeadersError} from '@vexl-next/rest-api/src/services/notification/contract'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option, Schema} from 'effect'
import {NotificationSocketMessaging} from '../../services/NotificationSocketMessaging'
import {UserLoginOnDifferentDeviceNoticeSendTask} from '../../services/NotificationSocketMessaging/domain'
import {NotificationTokensDb} from '../../services/NotificationTokensDb'
import {ExpoClientService} from '../../services/PushNotificationService/services/ExpoClientService'

// 26.11.2. Older apps would read the nudge as a login on another device and
// warn about it on every push token change.
const FIRST_VERSION_CODE_HANDLING_ACCOUNT_MOVED =
  Schema.decodeSync(VersionCode)(261100200)

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
          previous.value.clientVersion >=
            FIRST_VERSION_CODE_HANDLING_ACCOUNT_MOVED &&
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
  NotificationSocketMessaging | ExpoClientService
> =>
  Effect.gen(function* (_) {
    const socketMessaging = yield* _(NotificationSocketMessaging)
    yield* _(
      socketMessaging.sendNotice(
        new UserLoginOnDifferentDeviceNoticeSendTask({
          notificationToken: secret,
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
    // The secret now points at the new device, so the old push token is
    // addressed directly.
    const expoClient = yield* _(ExpoClientService)
    yield* _(
      expoClient.sendNotification([
        {
          token: previousExpoToken,
          data: new UserLoginOnDifferentDeviceNotificationData({
            trackingId: Option.none(),
            accountMoved: true,
          }).toData(),
        },
      ]),
      Effect.catchAll((e) =>
        Effect.logWarning('Failed to nudge the replaced device', e)
      )
    )
  })
