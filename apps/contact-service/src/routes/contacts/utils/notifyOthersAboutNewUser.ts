import {NewSocialNetworkConnectionNotificationData} from '@vexl-next/domain/src/general/notifications'
import {createNotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {Array, Effect, Either, Option, pipe} from 'effect'
import {type ExpoPushTicket} from 'expo-server-sdk'
import {UserDbService} from '../../../db/UserDbService'
import {NotificationsTokensEquivalence} from '../../../db/UserDbService/domain'
import {reportNewAppUser} from '../../../metrics'
import {type ExpoNotificationsService} from '../../../utils/expoNotifications/ExpoNotificationsService'
import {issueNotificationsToTokens} from '../../../utils/issueNotificationsToTokens'
import {type FirebaseMessagingService} from '../../../utils/notifications/FirebaseMessagingService'
import {type ServerHashedNumber} from '../../../utils/serverHashContact'

const FIRST_VERSION_THAT_SUPPORTS_ANALYTICS = 564

export const notifyOthersAboutNewUserForked = ({
  importedHashes,
  ownerHash,
}: {
  importedHashes: readonly ServerHashedNumber[]
  ownerHash: ServerHashedNumber
}): Effect.Effect<
  void,
  never,
  | UserDbService
  | FirebaseMessagingService
  | ExpoNotificationsService
  | MetricsClientService
> =>
  Effect.gen(function* (_) {
    const userDbService = yield* _(UserDbService)

    const firstLevelTokens = yield* _(
      userDbService.findFirebaseTokensOfUsersWhoDirectlyImportedHash({
        importedHashes,
        userHash: ownerHash,
      })
    )

    const secondLevelTokens = yield* _(
      userDbService.findFirebaseTokensOfUsersWhoHaveHAshAsSecondLevelContact({
        importedHashes,
        ownerHash,
      }),
      Effect.map(
        Array.filter(
          (token) =>
            !Array.containsWith(NotificationsTokensEquivalence)(
              firstLevelTokens,
              token
            )
        )
      )
    )

    yield* _(
      Effect.logInfo(
        `Queried first level: ${firstLevelTokens.length} second level: ${secondLevelTokens.length} tokens`
      )
    )

    if (firstLevelTokens.length === 0 && secondLevelTokens.length === 0) {
      return
    }

    const mergedTokens = [...firstLevelTokens, ...secondLevelTokens]
    const tokensForVersionWithoutAnalytics = Array.filter(
      mergedTokens,
      (one) => (one.clientVersion ?? 0) < FIRST_VERSION_THAT_SUPPORTS_ANALYTICS
    )
    const tokensForVersionWithAnalytics = Array.filter(
      mergedTokens,
      (one) => (one.clientVersion ?? 0) >= FIRST_VERSION_THAT_SUPPORTS_ANALYTICS
    )

    yield* _(
      issueNotificationsToTokens({
        data: new NewSocialNetworkConnectionNotificationData({
          type: 'NEW_APP_USER',
          trackingId: Option.none(),
          sentAt: unixMillisecondsNow(),
        }).toData(),
        tokens: tokensForVersionWithoutAnalytics,
      }),
      Effect.withSpan('Notify others about new connection (without analytics)')
    )

    const trackingId = createNotificationTrackingId()
    const issuedNotificationsWithAnalytics = yield* _(
      issueNotificationsToTokens({
        data: new NewSocialNetworkConnectionNotificationData({
          type: 'NEW_APP_USER',
          trackingId: Option.some(trackingId),
          sentAt: unixMillisecondsNow(),
        }).toData(),
        tokens: tokensForVersionWithAnalytics,
      }),
      Effect.withSpan('Notify others about new connection (with analytics)')
    )
    const successNotificationsLength = pipe(
      issuedNotificationsWithAnalytics.expo,
      Either.getOrElse(() => [] as ExpoPushTicket[]),
      Array.filter((o) => o.status === 'ok'),
      Array.length
    )
    yield* _(reportNewAppUser(successNotificationsLength, trackingId))
  }).pipe(
    Effect.tapBoth({
      onFailure: (e) =>
        Effect.logError('Error notifying others about new user', e),
      onSuccess: () => Effect.logInfo('Notified others about new user'),
    }),
    Effect.withSpan('Notify others about new user', {
      attributes: {
        hashesLength: Array.length(importedHashes),
        userHash: ownerHash,
      },
    }),
    Effect.forkDaemon,
    Effect.ignore
  )
