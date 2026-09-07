import {Effect} from 'effect'
import {MetricsClientService} from './MetricsClientService'
import {type MetricsMessage} from './domain'

export const reportMetricForked = (
  metricMessage: MetricsMessage
): Effect.Effect<void, never, MetricsClientService> =>
  Effect.gen(function* () {
    const metricsClient = yield* MetricsClientService
    yield* metricsClient.reportMetric(metricMessage)
  }).pipe(Effect.forkDetach, Effect.ignore)
