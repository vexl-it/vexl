import {Array, Effect} from 'effect'
import {
  UserNotificationService,
  type NotifyOthersAboutNewUserParams,
} from '../../../services/UserNotificationService'

export const notifyOthersAboutNewUserForked = (
  params: NotifyOthersAboutNewUserParams
): Effect.Effect<void, never, UserNotificationService> =>
  Effect.gen(function* (_) {
    const userNotificationService = yield* _(UserNotificationService)

    yield* _(userNotificationService.notifyOthersAboutNewUser(params))

    yield* _(Effect.logInfo('Notified others about new user'))
  }).pipe(
    Effect.withSpan('Notify others about new user', {
      attributes: {
        firstLevelHashesLength: Array.length(params.firstLevelHashes),
        secondLevelHashesLength: Array.length(params.secondLevelHashes),
        userHash: params.ownerHash,
      },
    }),
    Effect.forkDaemon,
    Effect.ignore
  )
