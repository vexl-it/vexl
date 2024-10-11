/* eslint-disable @typescript-eslint/no-invalid-void-type */
import {NodeContext} from '@effect/platform-node'
import {type ParseError} from '@effect/schema/ParseResult'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {healthServerLayer} from '@vexl-next/server-utils/src/HealthServer'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {Effect, Layer} from 'effect'
import {type IMessageTransferable} from 'redis-smq'
import {healthServerPortConfig, redisUrl} from './configs'
import DbLayer from './db/layer'
import {MetricsDbService} from './db/MetricsDbService'
import {MetricsConsumerService} from './utils/MetricsConsumerService/index'

const consumeMessage = (
  rawMessage: IMessageTransferable
): Effect.Effect<void, ParseError | UnexpectedServerError, MetricsDbService> =>
  Effect.gen(function* (_) {
    const message = yield* _(
      MetricsMessage.fromTransferferableMessage(rawMessage)
    )
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
            accepted_at: new Date(rawMessage.createdAt),
            data: rawMessage.body,
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

export const metricsServer = MetricsConsumerService.layer(
  redisUrl,
  consumeMessage
).pipe(
  Layer.provide(MetricsDbService.Live),
  Layer.provide(DbLayer),
  Layer.provide(healthServerLayer({port: healthServerPortConfig})),
  Layer.provide(NodeContext.layer),
  Layer.launch
)
