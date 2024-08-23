import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, Effect} from 'effect'
import {UserDbService} from '../../../db/UserDbService'
import {sendNotificationToAllHandleNonExistingTokens} from '../../../utils/notifications'
import {type FirebaseMessagingService} from '../../../utils/notifications/FirebaseMessagingService'

export const notifyOthersAboutNewUserForked = ({
  importedHashes,
  ownerHash,
}: {
  importedHashes: readonly HashedPhoneNumber[]
  ownerHash: HashedPhoneNumber
}): Effect.Effect<void, never, UserDbService | FirebaseMessagingService> =>
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
        Array.filter((token) => !Array.contains(firstLevelTokens, token))
      )
    )

    yield* _(
      Effect.logInfo(
        `Queried first level: ${firstLevelTokens.length} second level: ${secondLevelTokens.length} tokens`
      )
    )

    yield* _(
      sendNotificationToAllHandleNonExistingTokens({
        type: 'NEW_APP_USER',
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
