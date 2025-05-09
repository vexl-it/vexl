import {metricsQueueNameConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {Worker, type Job} from 'bullmq'
import {Context, Effect, Layer, Runtime, Schema, type ConfigError} from 'effect'
export class ErrorSettingUpConsumer extends Schema.TaggedError<ErrorSettingUpConsumer>(
  'ErrorSettingUpConsumer'
)('ErrorSettingUpConsumer', {
  message: Schema.String,
  cause: Schema.Unknown,
}) {}

export interface MetricsConsumerOperations {
  worker: Worker
}

export class MetricsConsumerService extends Context.Tag(
  'MetricsConsumerService'
)<MetricsConsumerService, MetricsConsumerOperations>() {
  static readonly layer = <E, R>(
    messageHandler: (message: Job) => Effect.Effect<void, E, R>
  ): Layer.Layer<
    MetricsConsumerService,
    ErrorSettingUpConsumer | ConfigError.ConfigError,
    R | RedisConnectionService
  > =>
    Layer.scoped(
      MetricsConsumerService,
      Effect.gen(function* (_) {
        const queueName = yield* _(metricsQueueNameConfig)

        const redisConnection = yield* _(RedisConnectionService)

        yield* _(Effect.log('Creating consumer worker'))

        const runPromise = Runtime.runPromise(yield* _(Effect.runtime<R>()))
        const worker = yield* _(
          Effect.try({
            try: () =>
              new Worker(
                queueName,
                async (job) => {
                  await runPromise(
                    messageHandler(job).pipe(
                      Effect.tapError((e) =>
                        Effect.logError('Error handling message', job, e)
                      ),
                      Effect.andThen(Effect.log('Message consumed')),
                      Effect.withSpan('Processing message', {
                        attributes: {
                          job,
                        },
                      })
                    )
                  )
                },
                {
                  connection: redisConnection,
                }
              ),
            catch: (e) =>
              new ErrorSettingUpConsumer({
                message: 'Error creating worker',
                cause: e,
              }),
          })
        )

        yield* _(
          Effect.addFinalizer(() =>
            Effect.promise(async () => {
              await worker.close()
            }).pipe(Effect.ignore)
          )
        )

        return {worker}
      })
    )
}
