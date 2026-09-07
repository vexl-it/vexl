import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type Job} from 'bullmq'
import {Effect, pipe} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {MetricsDbService} from './db/MetricsDbService'
import {MetricsConsumerService} from './utils/MetricsConsumerService/index'

const consumeMessage = (
  job: Job
): Effect.Effect<void, SchemaError | UnexpectedServerError, MetricsDbService> =>
  Effect.gen(function* () {
    const {message, meta} = yield* MetricsMessage.fromJob(job)

    yield* Effect.log('Received message', message)
    const metricsDb = yield* MetricsDbService
    yield* metricsDb.insertMetricRecord(message)

    yield* pipe(
      metricsDb.insertLastReportedByService({
        lastEventAt: message.timestamp,
        serviceName: meta.serviceName,
      }),
      Effect.tapError((e) =>
        Effect.logWarning('Error updating last reported by service', e)
      ),
      Effect.ignore
    )
  }).pipe(
    Effect.catch((e) =>
      MetricsDbService.pipe(
        Effect.flatMap((db) =>
          db.insertDeadMetricRecord({
            accepted_at: new Date(job.timestamp),
            data: job.data,
            message: `${e.message} \n${e.stack ?? '[No stack]'}`,
          })
        ),
        Effect.tap(
          Effect.logError(
            'Error handling message. Saving to dead message list',
            e
          )
        )
      )
    )
  )

export const MetricsConsumerServiceLive =
  MetricsConsumerService.layer(consumeMessage)
