import {Effect, Runtime} from 'effect'
import {type Consumer, type IMessageTransferable} from 'redis-smq'
import {ErrorSettingUpConsumer} from '.'

export const startConsumer = (
  consumer: Consumer
): Effect.Effect<void, ErrorSettingUpConsumer> =>
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
  Effect.async<void, ErrorSettingUpConsumer>((cb) => {
    consumer.run((err) => {
      if (err)
        cb(
          Effect.fail(
            new ErrorSettingUpConsumer({
              message: 'Error running consumer',
              cause: err,
            })
          )
        )
      else cb(Effect.void)
    })
  })

export const silentlyShutdownConsumer = (
  consumer: Consumer
): Effect.Effect<void> =>
  Effect.async((cb) => {
    consumer.shutdown((err) => {
      if (err) cb(Effect.logWarning('Error shutting down consumer', err))
      else cb(Effect.void)
    })
  }).pipe(Effect.zipLeft(Effect.log('Consumer shut down')))

export const registerMessageHandler = <E, R>(
  consumer: Consumer,
  queueName: string,
  handler: (message: IMessageTransferable) => Effect.Effect<void, E, R>
): Effect.Effect<void, ErrorSettingUpConsumer, R> =>
  Effect.gen(function* (_) {
    const runFork = Runtime.runFork(yield* _(Effect.runtime<R>()))

    yield* _(
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      Effect.async<void, ErrorSettingUpConsumer>((cb) => {
        consumer.consume(
          queueName,
          (message, consumedCallback) => {
            runFork(
              handler(message).pipe(
                Effect.tapBoth({
                  onFailure: (e) =>
                    Effect.logError('Error handling message', message, e),
                  onSuccess: () =>
                    Effect.sync(() => {
                      consumedCallback()
                    }).pipe(Effect.andThen(Effect.log('Message consumed'))),
                })
              )
            )
          },
          (err) => {
            if (err)
              cb(
                Effect.fail(
                  new ErrorSettingUpConsumer({
                    message: 'Error setting up messages consumer',
                    cause: err,
                  })
                )
              )
            else cb(Effect.void)
          }
        )
      })
    )
  })
