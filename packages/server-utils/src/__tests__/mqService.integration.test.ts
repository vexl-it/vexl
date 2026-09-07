import {Queue} from 'bullmq'
import {
  Array,
  Config,
  ConfigProvider,
  Deferred,
  Effect,
  Fiber,
  Layer,
  Schema,
} from 'effect'
import {randomUUID} from 'node:crypto'
import {RedisConnectionService} from '../RedisConnection'
import {makeMqService} from '../mqService'

it('bounds queued work, delivers every job, and closes the BullMQ worker', async () => {
  const prefix = `effect_v4_${randomUUID().replaceAll('-', '')}`
  const mq = makeMqService('migration_delivery', Schema.Number)
  const received: number[] = []
  await Effect.runPromise(
    Effect.gen(function* () {
      const connection = yield* RedisConnectionService
      const inspector = yield* Effect.acquireRelease(
        Effect.sync(
          () => new Queue('migration_delivery', {connection, prefix})
        ),
        (queue) =>
          Effect.promise(async () => {
            await queue.obliterate({force: true})
            await queue.close()
          })
      )
      const started = yield* Deferred.make<undefined>()
      const release = yield* Deferred.make<undefined>()
      const completed = yield* Deferred.make<undefined>()
      const consumer = yield* mq
        .consumerLayer((value) =>
          Effect.gen(function* () {
            if (value === 0) {
              yield* Deferred.succeed(started, undefined)
              yield* Deferred.await(release)
            }
            received.push(value)
            if (received.length === 64)
              yield* Deferred.succeed(completed, undefined)
          })
        )
        .pipe(Layer.launch, Effect.forkChild)
      const enqueue = yield* mq.EnqueueTask
      yield* Effect.forEach(Array.range(0, 63), (value) => enqueue(value))
      yield* Deferred.await(started)
      while (
        (yield* Effect.promise(
          async () => await inspector.getWaitingCount()
        )) !== 46
      ) {
        yield* Effect.sleep('5 millis')
      }
      expect(
        yield* Effect.promise(async () => await inspector.getActiveCount())
      ).toBe(1)
      yield* Deferred.succeed(release, undefined)
      yield* Deferred.await(completed)
      expect(received).toEqual(Array.range(0, 63))
      yield* Fiber.interrupt(consumer)
      expect(
        yield* Effect.promise(async () => await inspector.getWorkers())
      ).toHaveLength(0)
    }).pipe(
      Effect.scoped,
      Effect.provide(mq.producerLayer),
      Effect.provide(
        RedisConnectionService.layer(Config.string('TEST_REDIS_URL'))
      ),
      Effect.provide(
        ConfigProvider.layer(
          ConfigProvider.fromEnvRecord({
            ...process.env,
            REDIS_NAMESPACE_PREFIX: prefix,
          })
        )
      ),
      Effect.timeout('10 seconds')
    )
  )
}, 15000)
