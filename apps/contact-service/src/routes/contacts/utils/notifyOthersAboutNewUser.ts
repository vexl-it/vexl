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
  Effect.gen(function* (_) {
    const userNotificationService = yield* _(UserNotificationService)

    yield* _(
      userNotificationService.notifyOthersAboutNewUser(
        importedHashes,
        ownerHash
      )
    )

    yield* _(Effect.logInfo('Notified others about new user'))
  }).pipe(
    Effect.withSpan('Notify others about new user', {
      attributes: {
        hashesLength: Array.length(importedHashes),
        userHash: ownerHash,
      },
    }),
    Effect.forkDaemon,
    Effect.ignore
  )
