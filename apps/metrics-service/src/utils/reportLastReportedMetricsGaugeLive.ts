import {Array, Effect, flow, Layer, Metric} from 'effect/index'
import {MetricsDbService} from '../db/MetricsDbService'

export const reportLastReportedMetricsGaugeLive = Layer.effectDiscard(
  Effect.gen(function* (_) {
    yield* _(Effect.log('Reporting last reported metrics gauge'))

    const metricsDb = yield* _(MetricsDbService)

    return yield* _(
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
            return gauge(Effect.succeed(oneService.lastEventAt.getTime())).pipe(
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
          Effect.allWith({concurrency: 'unbounded'})
        )
      ),
      Effect.flatMap(() => Effect.sleep('5 minutes')),
      Effect.forever,
      Effect.withSpan('Report last reported metrics gauge'),
      Effect.fork
    )
  })
)
