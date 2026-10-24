import {
  bucketStartDay,
  dayOf,
  updatedDayFor,
} from '@vexl-next/analytics-definitions/src/buckets'
import {
  analyticsStateMaxAgeDays,
  defaultAnalyticsWindow,
  type AggregationDefinition,
  type AnalyticsStateId,
  type DayString,
  type JourneyDefinition,
} from '@vexl-next/analytics-definitions/src/core'
import {analyticsDefinitions} from '@vexl-next/analytics-definitions/src/registry'
import {fromDate} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
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

function lifetimePassed(
  startDay: DayString,
  lifetimeDays: number,
  now: Date
): boolean {
  return Date.parse(startDay) + lifetimeDays * DAY_MS <= now.getTime()
}

/** Journeys past their lifetime and aggregation buckets whose period ended. */
export function isExpired(instance: AnalyticsInstance, now: Date): boolean {
  const definition = analyticsDefinitions[instance.name]
  if (definition === undefined) return true
  if (definition.kind === 'journey')
    return lifetimePassed(instance.startDay, definition.lifetimeDays, now)
  return bucketStartDay(definition.period, now) > instance.startDay
}

/** Every open instance of the journey, or only the one with `key` when given. */
export function findOpenJourneys(
  instances: AnalyticsInstances,
  name: string,
  key?: string
): AnalyticsInstance[] {
  return pipe(
    Record.values(instances),
    Array.filter(
      (one) =>
        one.kind === 'journey' &&
        one.name === name &&
        !one.closed &&
        (key === undefined || one.key === key)
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
  key,
}: {
  definition: JourneyDefinitionOf<S, I>
  current: Option.Option<AnalyticsInstance>
  partial: Partial<S>
  now: Date
  newId: () => AnalyticsStateId
  key?: string
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
  const startDay = pipe(
    current,
    Option.map((one) => one.startDay),
    Option.getOrElse(() => dayOf(now))
  )
  const updatedDay = updatedDayFor(
    definition.updatedDayPrecision,
    startDay,
    now
  )

  return Option.some(
    Option.match(current, {
      onNone: (): AnalyticsInstance => ({
        id: newId(),
        kind: 'journey',
        name: definition.name,
        schemaVersion: definition.schemaVersion,
        revision: 0,
        startDay,
        startedAt: fromDate(now),
        updatedDay,
        payload,
        ...(key !== undefined ? {key} : {}),
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
  // A counter bumped past its cap fails the schema, so it stays at the cap.
  if (
    !Schema.is(definition.payloadSchema)(payload) ||
    (Option.isSome(current) &&
      Schema.equivalence(definition.payloadSchema)(payload, state))
  )
    return Option.none()

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

function isTooOldToUpload(instance: AnalyticsInstance, now: Date): boolean {
  const definition = analyticsDefinitions[instance.name]
  if (definition === undefined) return true
  const maxAgeDays = analyticsStateMaxAgeDays(
    definition,
    defaultAnalyticsWindow
  )
  // The server still accepts uploads on day `startDay + maxAgeDays`.
  return lifetimePassed(instance.startDay, maxAgeDays + 1, now)
}

/** Drops settled expired entries and any the server would refuse. */
export function pruneExpired(
  instances: AnalyticsInstances,
  now: Date
): AnalyticsInstances {
  return Record.filter(
    instances,
    (one) =>
      !isTooOldToUpload(one, now) && (one.pending || !isExpired(one, now))
  )
}

export function pendingUploads(
  instances: AnalyticsInstances
): AnalyticsInstance[] {
  return pipe(
    Record.values(instances),
    Array.filter((one) => one.pending)
  )
}
