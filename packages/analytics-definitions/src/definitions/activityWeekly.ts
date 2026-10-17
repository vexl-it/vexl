import {Schema} from 'effect'
import {
  cappedCounter,
  ClubCountBucket,
  OffersVisibleBucket,
  TenureBucket,
} from '../buckets'
import {defineAggregation} from '../core'
import {coreActivityFields} from '../coreAction'

export const activityWeeklyAggregation = defineAggregation({
  name: 'activityWeekly',
  schemaVersion: 1,
  period: 'week',
  state: Schema.Struct({
    tenure: TenureBucket,
    ...coreActivityFields,
    activeDays: Schema.optional(cappedCounter(7)),
    offersCreated: Schema.optional(cappedCounter(20)),
    requestsSent: Schema.optional(cappedCounter(50)),
    requestsApproved: Schema.optional(cappedCounter(50)),
    offersOpened: Schema.optional(cappedCounter(200)),
    offersVisible: Schema.optional(OffersVisibleBucket),
    notificationsAllowed: Schema.optional(Schema.Boolean),
    clubs: Schema.optional(ClubCountBucket),
  }),
})

export type ActivityWeeklyState =
  typeof activityWeeklyAggregation.payloadSchema.Type
