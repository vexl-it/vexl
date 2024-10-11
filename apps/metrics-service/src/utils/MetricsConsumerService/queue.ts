import {METRICS_QUEUE_NAME} from '@vexl-next/server-utils/src/metrics/domain'
import {Effect} from 'effect'
import {EQueueDeliveryModel, EQueueType, type Queue} from 'redis-smq'
import {ErrorSettingUpConsumer} from './ErrorSettingUpConsumer'

const checkQueueExists = (
  name: string,
  queue: Queue
): Effect.Effect<boolean, ErrorSettingUpConsumer, never> =>
  Effect.async<boolean, ErrorSettingUpConsumer>((cb) => {
    queue.exists(name, (err, exists) => {
      if (err)
        cb(
          Effect.fail(
            new ErrorSettingUpConsumer({
              message: 'Error checking if queue exists',
              cause: err,
            })
          )
        )
      else cb(Effect.succeed(exists ?? false))
    })
  })

const createMetricsQueue = (
  queue: Queue
): Effect.Effect<void, ErrorSettingUpConsumer> =>
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  Effect.async<void, ErrorSettingUpConsumer>((cb) => {
    queue.save(
      METRICS_QUEUE_NAME,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
      (err) => {
        if (err) {
          cb(
            Effect.fail(
              new ErrorSettingUpConsumer({
                message: 'Error creating queue',
                cause: err,
              })
            )
          )
        } else {
          cb(Effect.void)
        }
      }
    )
  })

export const ensureMetricsQueueExists = (
  queue: Queue
): Effect.Effect<void, ErrorSettingUpConsumer, never> =>
  Effect.gen(function* (_) {
    if (yield* _(checkQueueExists(METRICS_QUEUE_NAME, queue))) {
      yield* _(Effect.log('Queue already exists'))
      return
    }
    yield* _(createMetricsQueue(queue))
    yield* _(Effect.log('Queue created'))
  })

export const silentlyShutdownQueue = (queue: Queue): Effect.Effect<void> =>
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  Effect.async<void, never>((cb) => {
    queue.shutdown((err) => {
      if (err) cb(Effect.logWarning('Error shutting down queue', err))
      else cb(Effect.void)
    })
  }).pipe(Effect.zipLeft(Effect.log('Queue shut down')))
