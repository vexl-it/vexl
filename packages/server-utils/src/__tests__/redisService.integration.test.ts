import {UnixMilliseconds} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {
  Array,
  Config,
  Effect,
  Fiber,
  Layer,
  Order,
  Result,
  Schema,
  Stream,
} from 'effect'
import {randomUUID} from 'node:crypto'
import {RedisConnectionService} from '../RedisConnection'
import {RedisPubSubService} from '../RedisPubSubService'
import {RedisService} from '../RedisService'

const redisLayer = Layer.mergeAll(
  RedisService.Live,
  RedisPubSubService.Live
).pipe(
  Layer.provideMerge(
    RedisConnectionService.layer(Config.string('TEST_REDIS_URL'))
  )
)

it('round-trips values and fails missing keys with NoSuchElementError', async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const redis = yield* RedisService
      const key = `effect-v4-value-${randomUUID()}`
      const missing = yield* redis.get(Schema.String)(key).pipe(Effect.result)
      expect(Result.isFailure(missing)).toBe(true)
      if (Result.isFailure(missing))
        expect(missing.failure._tag).toBe('NoSuchElementError')
      yield* redis.set(Schema.String)(key, 'fixture', {
        expiresAt: Schema.decodeSync(UnixMilliseconds)(Date.now() + 60_000),
      })
      expect(yield* redis.get(Schema.String)(key)).toBe('fixture')
      yield* redis.delete(key)
    }).pipe(Effect.provide(redisLayer))
  )
})

it('reads and deletes sets while retaining missing-set failures', async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const redis = yield* RedisService
      const key = `effect-v4-set-${randomUUID()}`
      yield* redis.insertToSet(Schema.String)(key, ['first', 'second'])
      expect(
        yield* redis
          .getSet(Schema.String)(key)
          .pipe(Effect.map(Array.sort(Order.String)))
      ).toEqual(['first', 'second'])
      expect(
        yield* redis
          .readAndDeleteSet(Schema.String)(key)
          .pipe(Effect.map((values) => values.length))
      ).toBe(2)
      const missing = yield* redis
        .readAndDeleteSet(Schema.String)(key)
        .pipe(Effect.result)
      expect(Result.isFailure(missing)).toBe(true)
      if (Result.isFailure(missing))
        expect(missing.failure._tag).toBe('NoSuchElementError')
    }).pipe(Effect.provide(redisLayer))
  )
})

it('delivers pub/sub messages and unsubscribes after stream completion', async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const pubSub = yield* RedisPubSubService
      const connection = yield* RedisConnectionService
      const channel = `effect-v4-channel-${randomUUID()}`
      const subscriptionCount = Effect.promise(
        async () => await connection.pubsub('NUMSUB', channel)
      ).pipe(
        Effect.flatMap(
          Schema.decodeUnknownEffect(
            Schema.Tuple([Schema.String, Schema.Number])
          )
        ),
        Effect.map(([, count]) => count)
      )
      const consumer = yield* pubSub
        .subscribe(Schema.String)(channel)
        .pipe(Stream.take(2), Stream.runCollect, Effect.forkChild)
      while ((yield* subscriptionCount) === 0) yield* Effect.sleep('5 millis')
      yield* pubSub.publish(Schema.String)(channel, 'first')
      yield* pubSub.publish(Schema.String)(channel, 'second')
      expect(yield* Fiber.join(consumer)).toEqual(['first', 'second'])
      while ((yield* subscriptionCount) !== 0) yield* Effect.sleep('5 millis')
    }).pipe(Effect.timeout('5 seconds'), Effect.provide(redisLayer))
  )
})
