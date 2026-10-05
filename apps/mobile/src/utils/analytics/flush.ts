import {Effect, Option, Predicate} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import reportError from '../reportError'
import {
  analyticsEnabledAtom,
  analyticsInstancesAtom,
  setAnalyticsInstancesAtom,
} from './atoms'
import {toUpsert} from './domain'
import {pendingUploads, pruneSettledExpired, settleInstance} from './instances'

const errorStatus = (error: unknown): Option.Option<number> => {
  if (
    Predicate.hasProperty(error, 'status') &&
    Predicate.isNumber(error.status)
  )
    return Option.some(error.status)
  if (Predicate.hasProperty(error, 'response'))
    return errorStatus(error.response)
  return Option.none()
}

/** 4xx means the server will never accept this state: drop it. */
const RATE_LIMITED = 429

export const isRejectedByServer = (error: unknown): boolean =>
  Option.exists(
    errorStatus(error),
    (status) => status >= 400 && status < 500 && status !== RATE_LIMITED
  )

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
      const api = get(apiAtom).metrics

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

            yield* api.upsertAnalyticsState(toUpsert(instance)).pipe(
              Effect.map(() => true),
              Effect.catchAll((error) =>
                Effect.sync(() => {
                  const rejected = isRejectedByServer(error)
                  if (rejected)
                    reportError(
                      'warn',
                      new Error('Analytics state rejected by server'),
                      {
                        name: instance.name,
                        status: Option.getOrUndefined(errorStatus(error)),
                      }
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
