import {Array, Effect} from 'effect'
import {UserNotificationService} from '../../../services/UserNotificationService'
import {type ServerHashedNumber} from '../../../utils/serverHashContact'

export const notifyOthersAboutNewUserForked = ({
  importedHashes,
  ownerHash,
}: {
  importedHashes: readonly ServerHashedNumber[]
  ownerHash: ServerHashedNumber
}): Effect.Effect<void, never, UserNotificationService> =>
  Effect.gen(function* () {
    const userNotificationService = yield* UserNotificationService

    yield* userNotificationService.notifyOthersAboutNewUser(
      importedHashes,
      ownerHash
    )

    yield* Effect.logInfo('Notified others about new user')
  }).pipe(
    Effect.withSpan('Notify others about new user', {
      attributes: {
        hashesLength: Array.length(importedHashes),
        userHash: ownerHash,
      },
    }),
    Effect.forkDetach,
    Effect.ignore
  )
