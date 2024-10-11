import {Schema} from '@effect/schema'
import {
  setupRedisSmqConnection,
  type SettingUpRedisSmqConnectionError,
} from '@vexl-next/server-utils/src/metrics/setupRedisSmqConnection'
import {Context, Effect, Layer, type Config, type ConfigError} from 'effect'
import {Consumer, Queue, type IMessageTransferable} from 'redis-smq'
import {
  registerMessageHandler,
  silentlyShutdownConsumer,
  startConsumer,
} from './consumer'
import {ensureMetricsQueueExists, silentlyShutdownQueue} from './queue'

export class ErrorSettingUpConsumer extends Schema.TaggedError<ErrorSettingUpConsumer>(
  'ErrorSettingUpConsumer'
)('ErrorSettingUpConsumer', {
  message: Schema.String,
  cause: Schema.Unknown,
}) {}

export interface MetricsConsumerOperations {
  queue: Queue
  consumer: Consumer
}

export class MetricsConsumerService extends Context.Tag(
  'MetricsConsumerService'
)<MetricsConsumerService, MetricsConsumerOperations>() {
  static readonly layer = <E, R>(
    redisUrl: Config.Config<string>,
    messageHandler: (message: IMessageTransferable) => Effect.Effect<void, E, R>
  ): Layer.Layer<
    MetricsConsumerService,
    | ErrorSettingUpConsumer
    | ConfigError.ConfigError
    | SettingUpRedisSmqConnectionError,
    R
  > =>
    Layer.scoped(
      MetricsConsumerService,
      Effect.gen(function* (_) {
        yield* _(Effect.log('Configuring redis smq'))
        yield* _(setupRedisSmqConnection(redisUrl))

        yield* _(Effect.log('Ensuring queue exists'))
        const queue = new Queue()

        yield* _(Effect.addFinalizer(() => silentlyShutdownQueue(queue)))
        yield* _(ensureMetricsQueueExists(queue))
        yield* _(Effect.log('Queue ensured'))

        const consumer = new Consumer()
        yield* _(Effect.addFinalizer(() => silentlyShutdownConsumer(consumer)))
        yield* _(startConsumer(consumer))

        yield* _(registerMessageHandler(consumer, messageHandler))
        yield* _(Effect.log('Registered message handler'))

        return {queue, consumer}
      })
    )
}
