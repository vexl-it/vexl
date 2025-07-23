import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {NewSocialNetworkConnectionNotificationData} from '@vexl-next/domain/src/general/notifications'
import {Array, Effect, Option} from 'effect'
import {UserDbService} from '../../../db/UserDbService'
import {NotificationsTokensEquivalence} from '../../../db/UserDbService/domain'
import {type ExpoNotificationsService} from '../../../utils/expoNotifications/ExpoNotificationsService'
import {issueNotificationsToTokens} from '../../../utils/issueNotificationsToTokens'
import {type FirebaseMessagingService} from '../../../utils/notifications/FirebaseMessagingService'

export const notifyOthersAboutNewUserForked = ({
  importedHashes,
  ownerHash,
}: {
  importedHashes: readonly HashedPhoneNumber[]
  ownerHash: HashedPhoneNumber
}): Effect.Effect<
  void,
  never,
  UserDbService | FirebaseMessagingService | ExpoNotificationsService
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

    yield* _(
      issueNotificationsToTokens({
        data: new NewSocialNetworkConnectionNotificationData({
          type: 'NEW_APP_USER',
          trackingId: Option.none(),
        }).toData(),
        tokens: [...firstLevelTokens, ...secondLevelTokens],
      }),
      Effect.withSpan('Notify others about new connection')
    )
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
