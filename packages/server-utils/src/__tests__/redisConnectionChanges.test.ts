import {Deferred, Effect, Fiber, Stream} from 'effect'
import {EventEmitter} from 'node:events'
import {redisConnectionChanges} from '../RedisConnection/redisConnectionChanges'

it('emits connection events and removes listeners when the stream finishes', async () => {
  const redis = new EventEmitter()
  const connectionError = new Error('fixture connection failure')
  const events = await Effect.runPromise(
    Effect.gen(function* () {
      const listening = yield* Deferred.make<undefined>()
      redis.on('newListener', (event) => {
        if (event === 'end')
          Effect.runSync(Deferred.succeed(listening, undefined))
      })
      const consumer = yield* redisConnectionChanges(redis).pipe(
        Stream.take(2),
        Stream.runCollect,
        Effect.forkChild
      )
      yield* Deferred.await(listening)
      redis.emit('ready')
      redis.emit('error', connectionError)
      return yield* Fiber.join(consumer)
    })
  )
  expect(events).toEqual([
    {event: 'ready', error: undefined},
    {event: 'error', error: connectionError},
  ])
  for (const event of [
    'connect',
    'ready',
    'close',
    'reconnecting',
    'error',
    'end',
  ]) {
    expect(redis.listenerCount(event)).toBe(0)
  }
})
