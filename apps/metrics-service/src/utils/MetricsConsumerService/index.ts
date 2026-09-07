import {metricsQueueNameConfig} from '@vexl-next/server-utils/src/commonConfigs'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {Worker, type Job} from 'bullmq'
import {Context, Effect, Layer, Schema, type Config} from 'effect'
export class ErrorSettingUpConsumer extends Schema.TaggedError<ErrorSettingUpConsumer>(
  'ErrorSettingUpConsumer'
)('ErrorSettingUpConsumer', {
  message: Schema.String,
  cause: Schema.Unknown,
}) {}

export interface MetricsConsumerOperations {
  worker: Worker
}

export class MetricsConsumerService extends Context.Service<
  MetricsConsumerService,
  MetricsConsumerOperations
>()('MetricsConsumerService') {
  static readonly layer = <E, R>(
    messageHandler: (message: Job) => Effect.Effect<void, E, R>
  ): Layer.Layer<
    MetricsConsumerService,
    ErrorSettingUpConsumer | Config.ConfigError,
    R | RedisConnectionService
  > =>
    Layer.effect(
      MetricsConsumerService,
      Effect.gen(function* () {
        const queueName = yield* metricsQueueNameConfig

        const redisConnection = yield* RedisConnectionService

        yield* Effect.log('Creating consumer worker')

        const runPromise = Effect.runPromiseWith(yield* Effect.context<R>())
        const worker = yield* Effect.try({
          try: () =>
            new Worker(
              queueName,
              async (job) => {
                await runPromise(
                  messageHandler(job).pipe(
                    Effect.tapError((e) =>
                      Effect.logError('Error handling message', e, {
                        jobId: job.id,
                        jobName: job.name,
                      })
                    ),
                    Effect.andThen(Effect.log('Message consumed')),
                    Effect.withSpan('Processing message', {
                      attributes: {jobId: job.id},
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

        yield* Effect.addFinalizer(() =>
          Effect.promise(async () => {
            await worker.close()
          }).pipe(Effect.ignore)
        )

        return {worker}
      })
    )
}
