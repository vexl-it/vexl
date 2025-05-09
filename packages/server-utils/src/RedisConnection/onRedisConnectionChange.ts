import {Effect, Runtime, type Scope} from 'effect'
import type IORedis from 'ioredis'

type RedisConnectionEvent =
  | 'connect'
  | 'ready'
  | 'close'
  | 'reconnecting'
  | 'error'
  | 'end'

interface ConnectionState {
  event: RedisConnectionEvent
  error?: Error | undefined
}

type StateChangeListener = (state: ConnectionState) => Effect.Effect<void>

export function onRedisConnectionChange<R = never>(
  redis: IORedis,
  listener: StateChangeListener
): Effect.Effect<void, never, Scope.Scope | R> {
  return Effect.gen(function* (_) {
    const events: RedisConnectionEvent[] = [
      'connect',
      'ready',
      'close',
      'reconnecting',
      'error',
      'end',
    ]

    const runFork = Runtime.runFork(yield* _(Effect.runtime<R>()))

    const handlers: Partial<
      Record<RedisConnectionEvent, (...args: any[]) => void>
    > = {}

    for (const event of events) {
      const handler = (arg?: any): void => {
        const error =
          event === 'error' && arg instanceof Error ? arg : undefined
        runFork(listener({event, error}))
      }
      handlers[event] = handler
      redis.on(event, handler)
    }

    const off = Effect.sync(() => {
      for (const event of events) {
        const handler = handlers[event]
        if (handler) {
          redis.off(event, handler)
        }
      }
    })
    yield* _(Effect.addFinalizer(() => off))
  })
}
