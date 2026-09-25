import {dayOf, isoWeekStart} from '@vexl-next/analytics-definitions/src/buckets'
import {
  type AggregationDefinition,
  type AggregationPeriod,
  type AnalyticsStateId,
  type DayString,
  type JourneyDefinition,
} from '@vexl-next/analytics-definitions/src/core'
import {analyticsDefinitions} from '@vexl-next/analytics-definitions/src/registry'
import {Array, Option, Record, Schema, pipe} from 'effect'
import {type AnalyticsInstance, type AnalyticsInstances} from './domain'

type WithState<D, S, I> = Omit<D, 'payloadSchema'> & {
  readonly payloadSchema: Schema.Schema<S, I, never>
}
/** A journey definition seen through its decoded state type. */
export type JourneyDefinitionOf<S, I> = WithState<
  JourneyDefinition<string, Schema.Struct.Fields>,
  S,
  I
>
export type AggregationDefinitionOf<S, I> = WithState<
  AggregationDefinition<string, Schema.Struct.Fields>,
  S,
  I
>

const DAY_MS = 24 * 60 * 60 * 1000

const definitionsByName: Record<
  string,
  (typeof analyticsDefinitions)[keyof typeof analyticsDefinitions]
> = analyticsDefinitions

export function bucketStartDay(
  period: AggregationPeriod,
  now: Date
): DayString {
  if (period === 'week') return isoWeekStart(now)
  return dayOf(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))
}

function lifetimePassed(
  startDay: DayString,
  lifetimeDays: number,
  now: Date
): boolean {
  return Date.parse(startDay) + lifetimeDays * DAY_MS <= now.getTime()
}

/** Journeys past their lifetime and aggregation buckets whose period ended. */
export function isExpired(instance: AnalyticsInstance, now: Date): boolean {
  const definition = definitionsByName[instance.name]
  if (definition === undefined) return true
  if (definition.kind === 'journey')
    return lifetimePassed(instance.startDay, definition.lifetimeDays, now)
  return bucketStartDay(definition.period, now) > instance.startDay
}

export function findOpenJourney(
  instances: AnalyticsInstances,
  name: string
): Option.Option<AnalyticsInstance> {
  return pipe(
    Record.values(instances),
    Array.findFirst(
      (one) => one.kind === 'journey' && one.name === name && !one.closed
    )
  )
}

export function findAggregationBucket(
  instances: AnalyticsInstances,
  name: string,
  startDay: DayString
): Option.Option<AnalyticsInstance> {
  return pipe(
    Record.values(instances),
    Array.findFirst(
      (one) =>
        one.kind === 'aggregation' &&
        one.name === name &&
        one.startDay === startDay
    )
  )
}

export function applyJourneyStep<S extends object, I>({
  definition,
  current,
  partial,
  now,
  newId,
}: {
  definition: JourneyDefinitionOf<S, I>
  current: Option.Option<AnalyticsInstance>
  partial: Partial<S>
  now: Date
  newId: () => AnalyticsStateId
}): Option.Option<AnalyticsInstance> {
  if (
    Option.isSome(current) &&
    lifetimePassed(current.value.startDay, definition.lifetimeDays, now)
  )
    return Option.some({...current.value, closed: true})

  const payload: object = {
    ...Option.map(current, (one) => one.payload).pipe(
      Option.getOrElse(() => ({}))
    ),
    ...partial,
  }
  if (!Schema.is(definition.payloadSchema)(payload)) return Option.none()

  const closed =
    'step' in payload &&
    typeof payload.step === 'string' &&
    definition.terminalStates.includes(payload.step)
  const updatedDay =
    definition.updatedDayPrecision === 'week' ? isoWeekStart(now) : dayOf(now)

  return Option.some(
    Option.match(current, {
      onNone: (): AnalyticsInstance => ({
        id: newId(),
        kind: 'journey',
        name: definition.name,
        schemaVersion: definition.schemaVersion,
        revision: 0,
        startDay: dayOf(now),
        updatedDay,
        payload,
        closed,
        pending: true,
      }),
      onSome: (one): AnalyticsInstance => ({
        ...one,
        revision: one.revision + 1,
        updatedDay,
        payload,
        closed,
        pending: true,
      }),
    })
  )
}

export function applyAggregationUpdate<S extends object, I>({
  definition,
  current,
  initialState,
  update,
  now,
  newId,
}: {
  definition: AggregationDefinitionOf<S, I>
  current: Option.Option<AnalyticsInstance>
  initialState: S
  update: (state: S) => S
  now: Date
  newId: () => AnalyticsStateId
}): Option.Option<AnalyticsInstance> {
  const state = pipe(
    current,
    Option.flatMap((one) =>
      Schema.is(definition.payloadSchema)(one.payload)
        ? Option.some(one.payload)
        : Option.none()
    ),
    Option.getOrElse(() => initialState)
  )
  const payload = update(state)
  if (Option.isSome(current) && payload === state) return Option.none()

  const updatedDay = dayOf(now)
  return Option.some(
    Option.match(current, {
      onNone: (): AnalyticsInstance => ({
        id: newId(),
        kind: 'aggregation',
        name: definition.name,
        schemaVersion: definition.schemaVersion,
        revision: 0,
        startDay: bucketStartDay(definition.period, now),
        updatedDay,
        payload,
        closed: false,
        pending: true,
      }),
      onSome: (one): AnalyticsInstance => ({
        ...one,
        revision: one.revision + 1,
        updatedDay,
        payload,
        pending: true,
      }),
    })
  )
}

/**
 * Called after the server accepted (or rejected with 4xx) the upload of the
 * given revision. A newer local revision keeps its pending flag.
 */
export function settleInstance(
  instances: AnalyticsInstances,
  id: AnalyticsStateId,
  revision: number,
  now: Date
): AnalyticsInstances {
  const instance = instances[id]
  if (instance === undefined || instance.revision !== revision) return instances
  if (instance.closed || isExpired(instance, now))
    return Record.remove(instances, id)
  return {...instances, [id]: {...instance, pending: false}}
}

/** Drops expired entries that have nothing left to upload. */
export function pruneSettledExpired(
  instances: AnalyticsInstances,
  now: Date
): AnalyticsInstances {
  return Record.filter(instances, (one) => one.pending || !isExpired(one, now))
}

export function pendingUploads(
  instances: AnalyticsInstances
): AnalyticsInstance[] {
  return pipe(
    Record.values(instances),
    Array.filter((one) => one.pending)
  )
}
