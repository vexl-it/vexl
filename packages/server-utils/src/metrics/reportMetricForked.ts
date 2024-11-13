import {Effect} from 'effect'
import {MetricsClientService} from './MetricsClientService'
import {type MetricsMessage} from './domain'

export const reportMetricForked = (
  metricMessage: MetricsMessage
): Effect.Effect<void, never, MetricsClientService> =>
  Effect.gen(function* (_) {
    const metricsClient = yield* _(MetricsClientService)
    yield* _(metricsClient.reportMetric(metricMessage))
  }).pipe(Effect.forkDaemon, Effect.ignore)
