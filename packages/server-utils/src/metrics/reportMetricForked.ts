import {Effect} from 'effect'
import {type MetricsMessage} from './domain'
import {MetricsClientService} from './MetricsClientService'

export const reportMetricForked = (
  metricMessage: MetricsMessage
): Effect.Effect<void, never, MetricsClientService> =>
  Effect.gen(function* (_) {
    const metricsClient = yield* _(MetricsClientService)
    yield* _(metricsClient.reportMetric(metricMessage))
  }).pipe(Effect.forkDaemon, Effect.ignore)
