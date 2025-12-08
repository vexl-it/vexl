import {
  Context,
  Effect,
  flow,
  identity,
  Layer,
  pipe,
  Schema,
  Stream,
} from 'effect/index'
import {type ParseError} from 'effect/ParseResult'
import {RedisConnectionService} from './RedisConnection'
import {duplicateRedisAndConnect} from './RedisConnection/duplicateRedisAndConnect'
import {RedisError} from './RedisService'

export interface RedisPubSubServiceOperations {
  publish: <A, I, R>(
    messageSchema: Schema.Schema<A, I, R>
  ) => (
    channel: string,
    message: A
  ) => Effect.Effect<void, RedisError | ParseError, R>

  subscribe: <A, I, R>(
    messageSchema: Schema.Schema<A, I, R>
  ) => (channel: string) => Stream.Stream<A, RedisError, R>
}

export class RedisPubSubService extends Context.Tag('RedisPubSubService')<
  RedisPubSubService,
  RedisPubSubServiceOperations
>() {
  static Live = Layer.scoped(
    RedisPubSubService,
    Effect.gen(function* (_) {
      const redisConnection = yield* _(RedisConnectionService)
      const subscriberConnection = yield* _(
        duplicateRedisAndConnect(redisConnection)
      )

      const publish = (
        channel: string,
        message: string
      ): Effect.Effect<void, RedisError> =>
        Effect.tryPromise({
          try: async () => await redisConnection.publish(channel, message),
          catch: (cause) => new RedisError({cause}),
        }).pipe(Effect.asVoid)

      const subscribe = (channel: string): Stream.Stream<string, RedisError> =>
        Stream.asyncScoped<string, RedisError>((emit) =>
          Effect.gen(function* (_) {
            const onMessage = (ch: string, message: string): void => {
              if (channel === ch) {
                void emit.single(message)
              }
            }

            subscriberConnection.on('message', onMessage)
            yield* _(
              Effect.addFinalizer(() =>
                Effect.sync(() => {
                  subscriberConnection.off('message', onMessage)
                })
              )
            )

            yield* _(
              Effect.acquireRelease(
                Effect.tryPromise({
                  try: async () =>
                    await subscriberConnection.subscribe(channel),
                  catch: (cause) => new RedisError({cause}),
                }),
                () =>
                  Effect.sync(() => {
                    void subscriberConnection.unsubscribe(channel)
                  })
              )
            )
          })
        )

      return {
        publish: <A, I, R>(schema: Schema.Schema<A, I, R>) => {
          const encode = Schema.encode(Schema.parseJson(schema))
          return (channel: string, message: A) =>
            Effect.flatMap(encode(message), (encoded) =>
              publish(channel, encoded)
            )
        },
        subscribe: (schema) => {
          const decode = Schema.decode(Schema.parseJson(schema))
          return (channel) =>
            pipe(
              subscribe(channel),
              Stream.mapEffect(
                flow(
                  decode,
                  Effect.tapError((e) =>
                    Effect.logWarning(
                      'Failed to decode message on redis pubSub',
                      {
                        channel,
                        error: e,
                      }
                    )
                  ),
                  Effect.option
                )
              ),
              Stream.filterMap(identity)
            )
        },
      } satisfies RedisPubSubServiceOperations
    })
  )
}
