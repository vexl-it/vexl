import {bucketStartDay} from '@vexl-next/analytics-definitions/src/buckets'
import {AnalyticsStateId} from '@vexl-next/analytics-definitions/src/core'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {Array, Effect, Option, Record, Schema, pipe} from 'effect'
import {type Getter, type WritableAtom} from 'jotai'
import reportError from '../reportError'
import {analyticsActionAtom} from './analyticsActionAtom'
import {analyticsInstancesAtom, setAnalyticsInstancesAtom} from './atoms'
import {type AnalyticsInstance} from './domain'
import {flushAnalyticsActionAtom} from './flush'
import {
  applyAggregationUpdate,
  applyJourneyStep,
  findAggregationBucket,
  findOpenJourneys,
  isExpired,
  type AggregationDefinitionOf,
  type JourneyDefinitionOf,
} from './instances'

const newAnalyticsStateId = (): AnalyticsStateId =>
  Schema.decodeSync(AnalyticsStateId)(generateUuid())

export type JourneyUpdate<S> =
  | Partial<S>
  | ((current: Option.Option<S>) => Partial<S>)

export interface JourneyReportOptions {
  /**
   * Targets only the instance with this key, and gives it to a new one.
   * Without it the update goes to every open instance of the journey.
   */
  readonly key?: string
  /** Do not start a new instance when none is open. */
  readonly onlyIfOpen?: boolean
  /** Start a new instance even when one is open. */
  readonly alwaysStart?: boolean
}

const changesNothing = (state: object, partial: object): boolean =>
  Array.every(
    Record.toEntries(partial),
    ([field, value]) => Reflect.get(state, field) === value
  )

export function openJourneyStates<S extends object, I>(
  get: Getter,
  definition: JourneyDefinitionOf<S, I>,
  key?: string
): S[] {
  return pipe(
    findOpenJourneys(get(analyticsInstancesAtom), definition.name, key),
    Array.filter((one) => !isExpired(one, new Date())),
    Array.map((one) => one.payload),
    Array.filter(Schema.is(definition.payloadSchema))
  )
}

export function journeyReportActionAtom<S extends object, I>(
  definition: JourneyDefinitionOf<S, I>
): WritableAtom<
  null,
  [update: JourneyUpdate<S>, options?: JourneyReportOptions],
  void
> {
  return analyticsActionAtom(
    (get, set, update: JourneyUpdate<S>, options?: JourneyReportOptions) => {
      const instances = get(analyticsInstancesAtom)
      const open = options?.alwaysStart
        ? []
        : findOpenJourneys(instances, definition.name, options?.key)
      const targets: Array<Option.Option<AnalyticsInstance>> =
        Array.isNonEmptyArray(open)
          ? Array.map(open, Option.some)
          : options?.onlyIfOpen
            ? []
            : [Option.none()]
      const now = new Date()

      const updated = Array.filterMap(targets, (current) => {
        const state = Option.flatMap(current, (one) =>
          Schema.is(definition.payloadSchema)(one.payload)
            ? Option.some(one.payload)
            : Option.none()
        )
        const partial = typeof update === 'function' ? update(state) : update
        if (Option.isSome(state) && changesNothing(state.value, partial))
          return Option.none()

        const next = applyJourneyStep({
          definition,
          current,
          partial,
          now,
          newId: newAnalyticsStateId,
          key: options?.key,
        })
        if (Option.isNone(next))
          reportError('warn', new Error('Invalid analytics journey state'), {
            name: definition.name,
          })
        return next
      })
      if (!Array.isNonEmptyArray(updated)) return

      set(setAnalyticsInstancesAtom, {
        ...instances,
        ...Record.fromEntries(Array.map(updated, (one) => [one.id, one])),
      })
      // Journey steps go out right away; a failure leaves the entry pending for
      // the next start or background flush.
      Effect.runFork(set(flushAnalyticsActionAtom, 'journeys'))
    }
  )
}

export function aggregationReportActionAtom<S extends object, I>(
  definition: AggregationDefinitionOf<S, I>,
  initialState: (get: Getter, now: Date) => S
): WritableAtom<null, [update: (state: S) => S], void> {
  return analyticsActionAtom((get, set, update: (state: S) => S) => {
    const now = new Date()
    const instances = get(analyticsInstancesAtom)
    const next = applyAggregationUpdate({
      definition,
      current: findAggregationBucket(
        instances,
        definition.name,
        bucketStartDay(definition.period, now)
      ),
      initialState: initialState(get, now),
      update,
      now,
      newId: newAnalyticsStateId,
    })
    if (Option.isNone(next)) return
    set(setAnalyticsInstancesAtom, {...instances, [next.value.id]: next.value})
  })
}
