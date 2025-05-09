/* eslint-disable @typescript-eslint/no-invalid-void-type */
import {NodeContext} from '@effect/platform-node'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {RedisConnectionService} from '@vexl-next/server-utils/src/RedisConnection'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type Job} from 'bullmq'
import {Effect, Layer} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {healthServerPortConfig, redisUrl} from './configs'
import {MetricsDbService} from './db/MetricsDbService'
import DbLayer from './db/layer'
import {MetricsConsumerService} from './utils/MetricsConsumerService/index'

const consumeMessage = (
  job: Job
): Effect.Effect<void, ParseError | UnexpectedServerError, MetricsDbService> =>
  Effect.gen(function* (_) {
    const message = yield* _(MetricsMessage.fromJob(job))

    yield* _(Effect.log('Received message', message))
    const metricsDb = yield* _(MetricsDbService)
    yield* _(
      metricsDb.insertMetricRecord(message),
      Effect.catchTag('MessageWithUuidAlreadyStoredError', (e) =>
        Effect.logWarning('Message with uuid already stored', message)
      )
    )
  }).pipe(
    Effect.catchAll((e) =>
      MetricsDbService.pipe(
        Effect.flatMap((db) =>
          db.insertDeadMetricRecord({
            accepted_at: new Date(job.timestamp),
            data: job.data,
            message: `${e.message} \n${e.stack ?? '[No stack]'}`,
          })
        ),
        Effect.zipLeft(
          Effect.logError(
            'Error handling message. Saving to dead message list',
            e
          )
        )
      )
    )
  )

export const metricsServer = MetricsConsumerService.layer(consumeMessage).pipe(
  Layer.provide(
    healthServerLayer({
      port: healthServerPortConfig,
    })
  ),
  Layer.provide(MetricsDbService.Live),
  Layer.provideMerge(RedisConnectionService.layer(redisUrl)),
  Layer.provide(DbLayer),
  Layer.provide(NodeContext.layer),
  Layer.launch
)
