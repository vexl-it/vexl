import {Schema} from 'effect'
import {defineAggregation} from '../core'
import {coreActivityFields} from '../coreAction'

export const activityMonthlyAggregation = defineAggregation({
  name: 'activityMonthly',
  schemaVersion: 1,
  period: 'month',
  state: Schema.Struct(coreActivityFields),
})

export type ActivityMonthlyState =
  typeof activityMonthlyAggregation.payloadSchema.Type
