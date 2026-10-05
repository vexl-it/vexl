import {Schema} from 'effect'

export const AnalyticsKind = Schema.Literal('journey', 'aggregation')
export type AnalyticsKind = typeof AnalyticsKind.Type

export const DayString = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}$/),
  Schema.brand('DayString')
)
export type DayString = typeof DayString.Type

export const AnalyticsStateId = Schema.String.pipe(
  Schema.pattern(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  ),
  Schema.brand('AnalyticsStateId')
)
export type AnalyticsStateId = typeof AnalyticsStateId.Type

export const AnalyticsStateUpsert = Schema.Struct({
  id: AnalyticsStateId,
  kind: AnalyticsKind,
  name: Schema.String.pipe(Schema.maxLength(64)),
  schemaVersion: Schema.Int.pipe(Schema.positive()),
  revision: Schema.Int.pipe(Schema.nonNegative()),
  startDay: DayString,
  updatedDay: DayString,
  payload: Schema.Unknown,
})
export type AnalyticsStateUpsert = typeof AnalyticsStateUpsert.Type

export type UpdatedDayPrecision = 'day' | 'week'
export type AggregationPeriod = 'week' | 'month'

interface DefinitionBase<
  K extends AnalyticsKind,
  N extends string,
  F extends Schema.Struct.Fields,
> {
  readonly kind: K
  readonly name: N
  readonly schemaVersion: number
  readonly payloadSchema: Schema.Struct<F>
  readonly storeCountry: boolean
}

export interface JourneyDefinition<
  N extends string,
  F extends Schema.Struct.Fields,
> extends DefinitionBase<'journey', N, F> {
  readonly lifetimeDays: number
  readonly updatedDayPrecision: UpdatedDayPrecision
  readonly terminalStates: readonly string[]
}

export interface AggregationDefinition<
  N extends string,
  F extends Schema.Struct.Fields,
> extends DefinitionBase<'aggregation', N, F> {
  readonly period: AggregationPeriod
}

export type AnalyticsDefinition<
  N extends string = string,
  F extends Schema.Struct.Fields = Schema.Struct.Fields,
> = JourneyDefinition<N, F> | AggregationDefinition<N, F>

export const defineJourney = <
  N extends string,
  F extends Schema.Struct.Fields,
>({
  state,
  storeCountry = true,
  ...rest
}: {
  name: N
  schemaVersion: number
  lifetimeDays: number
  updatedDayPrecision: UpdatedDayPrecision
  storeCountry?: boolean
  state: Schema.Struct<F>
  terminalStates: readonly string[]
}): JourneyDefinition<N, F> => ({
  kind: 'journey',
  payloadSchema: state,
  storeCountry,
  ...rest,
})

export const defineAggregation = <
  N extends string,
  F extends Schema.Struct.Fields,
>({
  state,
  storeCountry = true,
  ...rest
}: {
  name: N
  schemaVersion: number
  period: AggregationPeriod
  storeCountry?: boolean
  state: Schema.Struct<F>
}): AggregationDefinition<N, F> => ({
  kind: 'aggregation',
  payloadSchema: state,
  storeCountry,
  ...rest,
})

export interface AnalyticsWindow {
  readonly graceDays: number
  readonly settleDays: number
}

/** Server defaults. The dashboard maturity rule reads the same values. */
export const defaultAnalyticsWindow: AnalyticsWindow = {
  graceDays: 7,
  settleDays: 14,
}

const PERIOD_DAYS: Record<AggregationPeriod, number> = {week: 7, month: 31}

export type AnalyticsRetentionShape =
  | {readonly kind: 'journey'; readonly lifetimeDays: number}
  | {readonly kind: 'aggregation'; readonly period: AggregationPeriod}

/**
 * Days after `startDay` during which the server still accepts an upload and
 * keeps the id. Shared by the handler, the expiry job and the dashboard.
 */
export const analyticsStateMaxAgeDays = (
  definition: AnalyticsRetentionShape,
  {graceDays, settleDays}: AnalyticsWindow
): number =>
  definition.kind === 'journey'
    ? definition.lifetimeDays + graceDays
    : PERIOD_DAYS[definition.period] - 1 + settleDays
