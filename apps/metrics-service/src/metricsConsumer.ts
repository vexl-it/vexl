/* eslint-disable @typescript-eslint/no-invalid-void-type */
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type Job} from 'bullmq'
import {Effect, Layer} from 'effect'
import {type ParseError} from 'effect/ParseResult'
import {MetricsDbService} from './db/MetricsDbService'
import {MetricsConsumerService} from './utils/MetricsConsumerService/index'

const consumeMessage = (
  job: Job
): Effect.Effect<void, ParseError | UnexpectedServerError, MetricsDbService> =>
  Effect.gen(function* (_) {
    const {message, meta} = yield* _(MetricsMessage.fromJob(job))

    yield* _(Effect.log('Received message', message))
    const metricsDb = yield* _(MetricsDbService)
    yield* _(
      metricsDb.insertMetricRecord(message),
      Effect.catchTag('MessageWithUuidAlreadyStoredError', (e) =>
        Effect.logWarning('Message with uuid already stored', message)
      )
    )

    yield* _(
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

export const metricsConsumerServiceEffect = MetricsConsumerService.layer(
  consumeMessage
).pipe(Layer.launch)
