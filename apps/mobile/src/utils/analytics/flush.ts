import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import reportError from '../reportError'
import {
  analyticsEnabledAtom,
  analyticsInstancesAtom,
  setAnalyticsInstancesAtom,
} from './atoms'
import {toUpsert} from './domain'
import {pendingUploads, pruneSettledExpired, settleInstance} from './instances'
import {isRejectedByGateway, uploadAnalyticsStateAtom} from './relay'

// Flushes run one at a time so a step recorded while an upload is in flight
// goes out in the next flush with the latest state instead of racing it.
const flushLock = Effect.unsafeMakeSemaphore(1)

export const flushAnalyticsActionAtom = atom(
  null,
  (get, set, scope: 'all' | 'journeys' = 'all'): Effect.Effect<void> =>
    Effect.gen(function* () {
      if (!get(analyticsEnabledAtom)) return
      set(setAnalyticsInstancesAtom, (instances) =>
        pruneSettledExpired(instances, new Date())
      )
      const upload = get(uploadAnalyticsStateAtom)
      if (Option.isNone(upload)) return

      yield* Effect.forEach(
        pendingUploads(get(analyticsInstancesAtom)),
        (queued) =>
          Effect.gen(function* () {
            const instance = get(analyticsInstancesAtom)[queued.id]
            if (
              !get(analyticsEnabledAtom) ||
              instance?.pending !== true ||
              (scope === 'journeys' && instance.kind !== 'journey')
            )
              return

            yield* upload.value(toUpsert(instance)).pipe(
              Effect.map(() => true),
              Effect.catchAll((error) =>
                Effect.sync(() => {
                  const rejected = isRejectedByGateway(error)
                  if (rejected)
                    reportError(
                      'warn',
                      new Error('Analytics state rejected by gateway'),
                      {name: instance.name, status: error.status}
                    )
                  return rejected
                })
              ),
              Effect.tap((settled) =>
                Effect.sync(() => {
                  if (!settled) return
                  set(setAnalyticsInstancesAtom, (instances) =>
                    settleInstance(
                      instances,
                      instance.id,
                      instance.revision,
                      new Date()
                    )
                  )
                })
              )
            )
          }),
        {discard: true}
      )
    }).pipe(flushLock.withPermits(1))
)
