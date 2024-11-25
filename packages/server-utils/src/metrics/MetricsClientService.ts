import {Context, Effect, Layer, type Config, type ConfigError} from 'effect'
import {Producer} from 'redis-smq'
import {
  CreatingMetricsClientError,
  ReportingMetricsError,
  type MetricsMessage,
} from './domain'
import {
  setupRedisSmqConnection,
  type SettingUpRedisSmqConnectionError,
} from './setupRedisSmqConnection'

export interface MetricsClientOperations {
  reportMetric: (
    message: MetricsMessage
  ) => Effect.Effect<void, ReportingMetricsError>
}

export class MetricsClientService extends Context.Tag('MetricsClientService')<
  MetricsClientService,
  MetricsClientOperations
>() {
  static readonly layer = (
    redisUrlConfig: Config.Config<string>
  ): Layer.Layer<
    MetricsClientService,
    | ConfigError.ConfigError
    | CreatingMetricsClientError
    | SettingUpRedisSmqConnectionError
  > =>
    Layer.scoped(
      MetricsClientService,
      Effect.gen(function* (_) {
        yield* _(
          Effect.log(
            'Debug log',
            'Initializing Metrics client service',
            'START'
          )
        )
        yield* _(setupRedisSmqConnection(redisUrlConfig))

        const runningProducer = yield* _(
          Effect.async<Producer, CreatingMetricsClientError>((cb) => {
            const producer = new Producer()
            producer.run((error) => {
              if (error) {
                cb(
                  Effect.fail(
                    new CreatingMetricsClientError({
                      message: 'Error running producer',
                      cause: error,
                    })
                  )
                )
              } else {
                cb(Effect.succeed(producer))
              }
            })
          })
        )

        const shutdownSilentlyEffect = Effect.async((cb) => {
          runningProducer.shutdown((error) => {
            if (error)
              cb(
                Effect.logWarning('Error while shutting down producer', {error})
              )
            cb(Effect.void)
          })
        })
        yield* _(Effect.addFinalizer(() => shutdownSilentlyEffect))

        const reportMetric = (
          message: MetricsMessage
        ): Effect.Effect<void, ReportingMetricsError> =>
          message.toProducibleMessage().pipe(
            Effect.catchAll(
              (error) =>
                new ReportingMetricsError({
                  cause: error,
                  message: 'Error while encoding message to send',
                })
            ),
            Effect.flatMap((messageToSend) => {
              // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
              return Effect.async<void, ReportingMetricsError>((cb) => {
                runningProducer.produce(messageToSend, (error) => {
                  if (error)
                    cb(
                      Effect.fail(
                        new ReportingMetricsError({
                          message: 'Error while reporting metric',
                          cause: error,
                        })
                      )
                    )
                  else cb(Effect.void)
                })
              })
            }),
            Effect.tapBoth({
              onFailure: (e) =>
                Effect.logError('Error while reporting metric', {
                  error: e,
                  message,
                }),
              onSuccess: () =>
                Effect.logInfo('Reported metric successfully', message),
            }),
            Effect.withSpan('reportMetric', {attributes: {message}})
          )

        yield* _(
          Effect.log('Debug log', 'Initializing Metrics client service', 'DONE')
        )
        return {reportMetric}
      })
    )
}
