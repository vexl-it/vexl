import {Queue} from 'bullmq'
import {Context, Effect, flow, Layer} from 'effect'
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

export class MetricsClientService extends Context.Service<
  MetricsClientService,
  MetricsClientOperations
>()('MetricsClientService') {
  static readonly Live = Layer.effect(
    MetricsClientService,
    Effect.gen(function* () {
      const redisConnection = yield* RedisConnectionService
      const queueName = yield* metricsQueueNameConfig

      const queue = yield* Effect.try({
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

      const shutdownSilentlyEffect = Effect.promise(async () => {
        await queue.close()
      }).pipe(Effect.ignore)
      yield* Effect.addFinalizer(() =>
        Effect.zip(
          shutdownSilentlyEffect,
          Effect.logInfo('Closing down client queue instance')
        )
      )

      const reportMetric = (
        message: MetricsMessage
      ): Effect.Effect<void, ReportingMetricsError> =>
        message.jobData.pipe(
          Effect.catch(
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
          flow(
            Effect.tapError((e) =>
              Effect.logWarning('Error while reporting metric', {
                error: e,
                metricName: message.name,
              })
            ),
            Effect.tap(() =>
              Effect.logInfo('Reported metric successfully', {
                metricName: message.name,
              })
            )
          ),
          Effect.withSpan('reportMetric', {
            attributes: {metricName: message.name},
          })
        )

      return {reportMetric}
    })
  )
}
