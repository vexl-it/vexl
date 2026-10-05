import {AnalyticsStateUpsert} from '@vexl-next/analytics-definitions/src/core'
import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Schema} from 'effect'

export const AnalyticsMarkers = Schema.Struct({
  firstOpenAt: Schema.optional(UnixMilliseconds),
  registeredAt: Schema.optional(UnixMilliseconds),
  activatedAt: Schema.optional(UnixMilliseconds),
})
export type AnalyticsMarkers = typeof AnalyticsMarkers.Type

/**
 * One open journey instance or one aggregation bucket: the upsert the server
 * receives plus the local upload bookkeeping.
 */
export const AnalyticsInstance = Schema.Struct({
  ...AnalyticsStateUpsert.fields,
  payload: Schema.Object,
  closed: Schema.Boolean,
  /** Local state is newer than what the server acknowledged. */
  pending: Schema.Boolean,
})
export type AnalyticsInstance = typeof AnalyticsInstance.Type

export const AnalyticsInstances = Schema.Record({
  key: Schema.String,
  value: AnalyticsInstance,
})
export type AnalyticsInstances = typeof AnalyticsInstances.Type

export function toUpsert({
  closed,
  pending,
  ...upsert
}: AnalyticsInstance): AnalyticsStateUpsert {
  return upsert
}
