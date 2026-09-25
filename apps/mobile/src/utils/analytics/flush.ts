import {Effect, Option, Predicate} from 'effect'
import {atom} from 'jotai'
import {apiAtom} from '../../api'
import reportError from '../reportError'
import {analyticsInstancesAtom, setAnalyticsInstancesAtom} from './atoms'
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

export const flushAnalyticsActionAtom = atom(
  null,
  (get, set): Effect.Effect<void> =>
    Effect.gen(function* () {
      set(setAnalyticsInstancesAtom, (instances) =>
        pruneSettledExpired(instances, new Date())
      )
      const api = get(apiAtom).metrics

      yield* Effect.forEach(
        pendingUploads(get(analyticsInstancesAtom)),
        (instance) =>
          api.upsertAnalyticsState(toUpsert(instance)).pipe(
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
          ),
        {discard: true}
      )
    })
)
