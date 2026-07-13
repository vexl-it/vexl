import {type TransferId} from '@vexl-next/domain/src/general/deviceMigration/brands'
import {DeviceMigrationError} from '@vexl-next/domain/src/general/deviceMigration/errors'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Effect} from 'effect'
import {
  drainAndBlockVexlRequests,
  reopenVexlRequests,
} from '../../../api/vexlHttpClientLayer'
import {
  flushAllPendingMmkvWrites,
  freezeMmkvPersistence,
} from '../../atomUtils/mmkvMigrationRegistry'
import {interruptAndAwaitAllInAppLoadingTasks} from '../../inAppLoadingTasks/managedTaskFibers'
import {transitionMigrationControl} from '../controlStore'

const error = (code: DeviceMigrationError['code']): DeviceMigrationError =>
  new DeviceMigrationError({code})

/** Enters source quiescence in the exact persisted/drain/freeze order. */
export function enterSourceQuiescence(
  transferId: TransferId
): Effect.Effect<void, DeviceMigrationError> {
  return Effect.gen(function* (_) {
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['normal'], {
            mode: 'sourceQuiescing',
            enteredAt: unixMillisecondsNow(),
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
    yield* _(interruptAndAwaitAllInAppLoadingTasks())
    const drained = yield* _(
      drainAndBlockVexlRequests(10_000).pipe(Effect.either)
    )
    if (drained._tag === 'Left') {
      reopenVexlRequests()
      yield* _(
        Effect.try({
          try: () => {
            transitionMigrationControl(['sourceQuiescing'], {mode: 'normal'})
          },
          catch: () => error('stateInvalid'),
        })
      )
      return yield* _(Effect.fail(error('timedOut')))
    }
    yield* _(
      Effect.sync(() => {
        flushAllPendingMmkvWrites()
        freezeMmkvPersistence()
      })
    )
    yield* _(
      Effect.try({
        try: () => {
          transitionMigrationControl(['sourceQuiescing'], {
            mode: 'sourceServing',
            enteredAt: unixMillisecondsNow(),
            transferId,
          })
        },
        catch: () => error('stateInvalid'),
      })
    )
  })
}
