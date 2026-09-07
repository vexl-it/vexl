import {
  Context,
  Effect,
  Filter,
  flow,
  identity,
  Layer,
  pipe,
  Schema,
  Stream,
} from 'effect'
import {offer} from 'effect/Queue'
import {type SchemaError} from 'effect/Schema'
import {RedisConnectionService} from './RedisConnection'
import {duplicateRedisAndConnect} from './RedisConnection/duplicateRedisAndConnect'
import {RedisError} from './RedisService'

export interface RedisPubSubServiceOperations {
  publish: <A, I, R>(
    messageSchema: Schema.Codec<A, I, R, R>
  ) => (
    channel: string,
    message: A
  ) => Effect.Effect<void, RedisError | SchemaError, R>

  subscribe: <A, I, R>(
    messageSchema: Schema.Codec<A, I, R, R>
  ) => (channel: string) => Stream.Stream<A, RedisError, R>
}

export class RedisPubSubService extends Context.Service<
  RedisPubSubService,
  RedisPubSubServiceOperations
>()('RedisPubSubService') {
  static Live = Layer.effect(
    RedisPubSubService,
    Effect.gen(function* () {
      const redisConnection = yield* RedisConnectionService
      const subscriberConnection =
        yield* duplicateRedisAndConnect(redisConnection)

      const publish = (
        channel: string,
        message: string
      ): Effect.Effect<void, RedisError> =>
        Effect.tryPromise({
          try: async () => await redisConnection.publish(channel, message),
          catch: (cause) => new RedisError({cause}),
        }).pipe(Effect.asVoid)

      const subscribe = (channel: string): Stream.Stream<string, RedisError> =>
        Stream.callback<string, RedisError>(
          (messages) =>
            Effect.gen(function* () {
              const onMessage = (ch: string, message: string): void => {
                if (channel === ch) {
                  void Effect.runPromise(offer(messages, message))
                }
              }

              subscriberConnection.on('message', onMessage)
              yield* Effect.addFinalizer(() =>
                Effect.sync(() => {
                  subscriberConnection.off('message', onMessage)
                })
              )

              yield* Effect.acquireRelease(
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
            }),
          {bufferSize: 16}
        )

      return {
        publish: <A, I, R>(schema: Schema.Codec<A, I, R, R>) => {
          const encode = Schema.encodeEffect(Schema.fromJsonString(schema))
          return (channel: string, message: A) =>
            Effect.flatMap(encode(message), (encoded) =>
              publish(channel, encoded)
            )
        },
        subscribe: (schema) => {
          const decode = Schema.decodeEffect(Schema.fromJsonString(schema))
          return (channel) =>
            pipe(
              subscribe(channel),
              Stream.mapEffect(
                flow(
                  (message: string) => decode(message),
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
              Stream.filterMap(Filter.fromPredicateOption(identity))
            )
        },
      } satisfies RedisPubSubServiceOperations
    })
  )
}
