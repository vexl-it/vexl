import {Array, Effect, flow, Layer, Metric, pipe} from 'effect'
import {MetricsDbService} from '../db/MetricsDbService'

export const reportLastReportedMetricsGaugeLive = Layer.effectDiscard(
  Effect.gen(function* () {
    yield* Effect.log('Reporting last reported metrics gauge')

    const metricsDb = yield* MetricsDbService

    return yield* pipe(
      metricsDb.queryAllLastReportedByService(),
      Effect.flatMap(
        flow(
          Array.map((oneService) => {
            const gauge = Metric.gauge(
              `last_reported_metrics_${oneService.serviceName}`,
              {
                description: `Last reported metrics time for service ${oneService.serviceName}`,
              }
            )
            return Metric.update(gauge, oneService.lastEventAt.getTime()).pipe(
              Effect.tap(() =>
                Effect.logInfo(
                  `Reporting last reported metrics for service`,
                  oneService
                )
              ),
              Effect.tapError((e) =>
                Effect.logWarning(
                  'Error while reporting last reported metrics',
                  e
                )
              ),
              Effect.ignore
            )
          }),
          (effects) => Effect.all(effects, {concurrency: 'unbounded'})
        )
      ),
      Effect.flatMap(() => Effect.sleep('5 minutes')),
      Effect.forever,
      Effect.withSpan('Report last reported metrics gauge'),
      Effect.forkChild
    )
  })
)
