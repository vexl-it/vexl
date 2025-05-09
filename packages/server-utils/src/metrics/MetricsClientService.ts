import {Queue} from 'bullmq'
import {Context, Effect, Layer} from 'effect'
import {metricsQueueNameConfig} from '../commonConfigs'
import {RedisConnectionService} from '../RedisConnection'
import {
  CreatingMetricsClientError,
  ReportingMetricsError,
  type MetricsMessage,
} from './domain'

export interface MetricsClientOperations {
  reportMetric: (
    message: MetricsMessage
  ) => Effect.Effect<void, ReportingMetricsError>
}

export class MetricsClientService extends Context.Tag('MetricsClientService')<
  MetricsClientService,
  MetricsClientOperations
>() {
  static readonly Live = Layer.scoped(
    MetricsClientService,
    Effect.gen(function* (_) {
      const redisConnection = yield* _(RedisConnectionService)
      const queueName = yield* _(metricsQueueNameConfig)

      const queue = yield* _(
        Effect.try({
          try: () =>
            new Queue(queueName, {
              defaultJobOptions: {
                removeOnComplete: true,
              },
              connection: redisConnection,
            }),
          catch: (error) =>
            new CreatingMetricsClientError({
              message: 'Error creating queue',
              cause: error,
            }),
        })
      )

      const shutdownSilentlyEffect = Effect.promise(async () => {
        await queue.close()
      }).pipe(Effect.ignore)
      yield* _(
        Effect.addFinalizer(() =>
          Effect.zip(
            shutdownSilentlyEffect,
            Effect.logInfo('Closing down client queue instance')
          )
        )
      )

      const reportMetric = (
        message: MetricsMessage
      ): Effect.Effect<void, ReportingMetricsError> =>
        message.jobData.pipe(
          Effect.catchAll(
            (error) =>
              new ReportingMetricsError({
                cause: error,
                message: 'Error while encoding message to send',
              })
          ),
          Effect.flatMap((messageToSend) =>
            Effect.tryPromise({
              try: async () => await queue.add(queueName, messageToSend),
              catch: (error) =>
                new ReportingMetricsError({
                  cause: error,
                  message: 'Error while adding job to queue',
                }),
            })
          ),
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

      return {reportMetric}
    })
  )
}
