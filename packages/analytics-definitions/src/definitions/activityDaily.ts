import {Schema} from 'effect'
import {defineAggregation} from '../core'
import {coreActivityFields} from '../coreAction'

export const activityDailyAggregation = defineAggregation({
  name: 'activityDaily',
  schemaVersion: 1,
  period: 'day',
  state: Schema.Struct(coreActivityFields),
})

export type ActivityDailyState =
  typeof activityDailyAggregation.payloadSchema.Type
