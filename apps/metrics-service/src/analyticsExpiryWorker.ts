import {analyticsStateMaxAgeDays} from '@vexl-next/analytics-definitions/src/core'
import {analyticsDefinitions} from '@vexl-next/analytics-definitions/src/registry'
import {makeRepeatingTaskLayer} from '@vexl-next/server-utils/src/repeatingTask'
import {Effect, Record} from 'effect'
import {
  analyticsExpiryCronConfig,
  analyticsRetentionDaysConfig,
  analyticsWindowConfig,
} from './configs'
import {MetricsDbService} from './db/MetricsDbService'

export const expireAnalyticsStatesTask = Effect.gen(function* (_) {
  const db = yield* _(MetricsDbService)
  const window = yield* _(analyticsWindowConfig)
  const retentionDays = yield* _(analyticsRetentionDaysConfig)

  yield* _(
    Effect.forEach(Record.values(analyticsDefinitions), (definition) =>
      db
        .expireAnalyticsStateIds({
          name: definition.name,
          maxAgeDays: analyticsStateMaxAgeDays(definition, window),
        })
        .pipe(
          Effect.tap((count) =>
            Effect.log(
              `Expired ${count} ${definition.name} analytics state ids`
            )
          )
        )
    )
  )

  const deleted = yield* _(db.deleteExpiredAnalyticsStates({retentionDays}))
  yield* _(
    Effect.log(
      `Deleted ${deleted} analytics states older than ${retentionDays} days`
    )
  )
})

export const AnalyticsExpiryWorkerLayer = makeRepeatingTaskLayer({
  queueName: 'metrics-service-analytics-expiry',
  jobName: 'analytics_expiry',
  cronPattern: analyticsExpiryCronConfig,
  lockResource: 'metricsService:analyticsExpiry',
  lockDuration: '10 minutes',
  task: expireAnalyticsStatesTask,
})
