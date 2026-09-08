import {Array, Data, Effect, Stream} from 'effect'
import {offer} from 'effect/Queue'
import {type EventEmitter} from 'node:events'

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
  redis: Pick<EventEmitter, 'on' | 'off'>
): Stream.Stream<ConnectionState> =>
  Stream.callback<ConnectionState>(
    (messages) =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const handlers = new Map<
            RedisConnectionEvent,
            (arg?: unknown) => void
          >()
          Array.forEach(events, (event) => {
            const handler = (arg?: unknown): void => {
              const error =
                event === 'error' && arg instanceof Error ? arg : undefined
              void Effect.runPromise(offer(messages, {event, error}))
            }
            handlers.set(event, handler)
            redis.on(event, handler)
          })
          return handlers
        }),
        (handlers) =>
          Effect.sync(() => {
            handlers.forEach((handler, event) => redis.off(event, handler))
          })
      ),
    {bufferSize: 16}
  )
