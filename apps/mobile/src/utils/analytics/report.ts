import {AnalyticsStateId} from '@vexl-next/analytics-definitions/src/core'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Effect, Option, Schema} from 'effect'
import {atom, type WritableAtom} from 'jotai'
import reportError from '../reportError'
import {
  analyticsEnabledAtom,
  analyticsInstancesAtom,
  setAnalyticsInstancesAtom,
} from './atoms'
import {flushAnalyticsActionAtom} from './flush'
import {
  applyAggregationUpdate,
  applyJourneyStep,
  bucketStartDay,
  findAggregationBucket,
  findOpenJourney,
  type AggregationDefinitionOf,
  type JourneyDefinitionOf,
} from './instances'

const newAnalyticsStateId = (): AnalyticsStateId =>
  Schema.decodeSync(AnalyticsStateId)(generateUuid())

export interface JourneyReportOptions {
  /** Do not start a new instance when none is open. */
  readonly onlyIfOpen?: boolean
}

export function journeyReportActionAtom<S extends object, I>(
  definition: JourneyDefinitionOf<S, I>
): WritableAtom<
  null,
  [partial: Partial<S>, options?: JourneyReportOptions],
  void
> {
  return atom(null, (get, set, partial, options) => {
    if (!get(analyticsEnabledAtom)) return

    const instances = get(analyticsInstancesAtom)
    const current = findOpenJourney(instances, definition.name)
    if (Option.isNone(current) && options?.onlyIfOpen) return

    const next = applyJourneyStep({
      definition,
      current,
      partial,
      now: new Date(),
      newId: newAnalyticsStateId,
    })
    if (Option.isNone(next)) {
      reportError('warn', new Error('Invalid analytics journey state'), {
        name: definition.name,
      })
      return
    }
    set(setAnalyticsInstancesAtom, {...instances, [next.value.id]: next.value})
    // Journey steps go out right away; a failure leaves the entry pending for
    // the next start or background flush.
    Effect.runFork(set(flushAnalyticsActionAtom, 'journeys'))
  })
}

export function aggregationReportActionAtom<S extends object, I>(
  definition: AggregationDefinitionOf<S, I>,
  initialState: S
): WritableAtom<null, [update: (state: S) => S], void> {
  return atom(null, (get, set, update) => {
    if (!get(analyticsEnabledAtom)) return

    const now = new Date()
    const instances = get(analyticsInstancesAtom)
    const next = applyAggregationUpdate({
      definition,
      current: findAggregationBucket(
        instances,
        definition.name,
        bucketStartDay(definition.period, now)
      ),
      initialState,
      update,
      now,
      newId: newAnalyticsStateId,
    })
    if (Option.isNone(next)) return
    set(setAnalyticsInstancesAtom, {...instances, [next.value.id]: next.value})
  })
}
