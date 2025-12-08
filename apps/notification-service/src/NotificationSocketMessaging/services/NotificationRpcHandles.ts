import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  type NotificationsStreamClientInfo,
  type NotificationStreamError,
  type NotificationStreamMessage,
  Rpcs,
} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {Effect, Either, identity, Queue, Schedule, Stream} from 'effect/index'
import {type Scope} from 'effect/Scope'
import {LocalConnectionRegistry} from './LocalConnectionRegistry'
import {RedisConnectionRegistry} from './RedisConnectionRegistry'

const keepAliveAsLongAsScopeInRedisRegistry = (
  clientInfo: NotificationsStreamClientInfo
): Effect.Effect<void, never, RedisConnectionRegistry | Scope> =>
  Effect.flatMap(RedisConnectionRegistry, (registry) =>
    registry.keepAlive(clientInfo.notificationToken)
  ).pipe(Effect.schedule(Schedule.spaced('1 minute')), Effect.forkScoped)

export const NotificationRpcsHandlers = Rpcs.toLayer(
  Effect.gen(function* (_) {
    const localRegistry = yield* _(LocalConnectionRegistry)
    const redisRegistry = yield* _(RedisConnectionRegistry)

    return {
      listenToNotifications: (connectionInfo) =>
        Stream.unwrapScoped(
          Effect.gen(function* (_) {
            yield* _(
              Effect.acquireRelease(
                Effect.log(
                  'New notification stream connection established',
                  connectionInfo
                ),
                () =>
                  Effect.log(
                    'Notification stream connection closed',
                    connectionInfo
                  )
              )
            )

            const queue = yield* _(
              Effect.acquireRelease(
                Queue.sliding<
                  Either.Either<
                    NotificationStreamMessage,
                    NotificationStreamError
                  >
                >(42),
                Queue.shutdown
              )
            )

            const send = (
              message: NotificationStreamMessage
            ): Effect.Effect<boolean> =>
              Queue.offer(queue, Either.right(message))

            const kickOut = (
              error?: NotificationStreamError
            ): Effect.Effect<boolean> =>
              Queue.offer(
                queue,
                Either.left(
                  error ??
                    new UnexpectedServerError({
                      cause: 'kicked out',
                      message: 'Kicked out by server',
                    })
                )
              )

            // Register connection in both local and redis registries
            yield* _(
              Effect.acquireRelease(
                localRegistry.registerConnection({
                  connectionInfo,
                  send,
                  kickOut,
                }),
                () =>
                  localRegistry.removeConnection(
                    connectionInfo.notificationToken
                  )
              )
            )
            yield* _(
              Effect.acquireRelease(
                redisRegistry.registerConnection(connectionInfo),
                () =>
                  redisRegistry
                    .removeConnection(connectionInfo.notificationToken)
                    .pipe(Effect.ignore)
              )
            )

            // Keep the connection alive in redis registry

            yield* _(keepAliveAsLongAsScopeInRedisRegistry(connectionInfo))

            return Stream.fromQueue(queue).pipe(
              Stream.tap((e) =>
                Effect.log('Sending event to client', e, connectionInfo)
              ),
              Stream.mapEffect(identity)
            )
          })
        ).pipe(
          Stream.withSpan('NotificationStream', {
            attributes: {...connectionInfo},
          })
        ),
    }
  })
)
