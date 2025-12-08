import {Array, Data, Effect, Stream} from 'effect'
import type IORedis from 'ioredis'

const events = [
  'connect',
  'ready',
  'close',
  'reconnecting',
  'error',
  'end',
] as const

type RedisConnectionEvent = (typeof events)[number]

export interface ConnectionState {
  event: RedisConnectionEvent
  error?: Error | undefined
}

export class ReddisOfflineForTooLongError extends Data.TaggedError(
  'RedisError'
)<{cause: unknown; message: string}> {}

export const redisConnectionChanges = (
  redis: IORedis
): Stream.Stream<ConnectionState> =>
  Stream.async<ConnectionState>((emit) => {
    const handlers = new Map<RedisConnectionEvent, (...args: any[]) => void>()

    Array.forEach(events, (event) => {
      const handler = (arg?: unknown): void => {
        const error =
          event === 'error' && arg instanceof Error ? arg : undefined
        void emit.single({event, error})
      }
      handlers.set(event, handler)
      redis.on(event, handler)
    })

    return Effect.sync(() => {
      handlers.forEach((handler, event) => {
        redis.off(event, handler)
      })
    })
  })
