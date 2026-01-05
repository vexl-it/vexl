import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {isVexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  type NotificationStreamError,
  type NotificationStreamMessage,
  Rpcs,
} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {
  Array,
  Chunk,
  Effect,
  Either,
  identity,
  Queue,
  Schedule,
  Stream,
} from 'effect/index'
import {type Scope} from 'effect/Scope'
import {ThrottledPushNotificationService} from '../../ThrottledPushNotificationService'
import {VexlNotificationTokenService} from '../../VexlNotificationTokenService'
import {
  type ClientInfo,
  newStreamConnectionId,
  type StreamConnectionId,
} from '../domain'
import {LocalConnectionRegistry} from './LocalConnectionRegistry'
import {RedisConnectionRegistry} from './RedisConnectionRegistry'

const keepAliveAsLongAsScopeInRedisRegistry = (
  connectionId: StreamConnectionId,
  clientInfo: ClientInfo
): Effect.Effect<void, never, RedisConnectionRegistry | Scope> =>
  Effect.flatMap(RedisConnectionRegistry, (registry) =>
    registry.keepAlive(connectionId, clientInfo.notificationToken)
  ).pipe(Effect.schedule(Schedule.spaced('1 minute')), Effect.forkScoped)

export const NotificationRpcsHandlers = Rpcs.toLayer(
  Effect.gen(function* (_) {
    const localRegistry = yield* _(LocalConnectionRegistry)
    const redisRegistry = yield* _(RedisConnectionRegistry)
    const throttledPushNotificationService = yield* _(
      ThrottledPushNotificationService
    )

    return {
      listenToNotifications: (connectionInfo) =>
        Stream.unwrapScoped(
          Effect.gen(function* (_) {
            const notificationTokenService = yield* _(
              VexlNotificationTokenService
            )

            // TODO #2124 - use token from info directly
            const vexlNotificationToken = isVexlNotificationToken(
              connectionInfo.notificationToken
            )
              ? connectionInfo.notificationToken
              : notificationTokenService.createTemporaryVexlNotificationToken(
                  connectionInfo.notificationToken
                )

            const connectionId = newStreamConnectionId()
            const clientInfo: ClientInfo = {
              notificationToken: vexlNotificationToken,
              platform: connectionInfo.platform,
              version: connectionInfo.version,
            }

            yield* _(
              Effect.acquireRelease(
                Effect.log(
                  'New notification stream connection established',
                  connectionId,
                  connectionInfo
                ),
                () =>
                  Effect.log(
                    'Notification stream connection closed',
                    connectionId,
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
                localRegistry.registerConnection(
                  {
                    connectionInfo: {
                      ...connectionInfo,
                      notificationToken: vexlNotificationToken,
                    },
                    send,
                    kickOut,
                  },
                  connectionId
                ),
                () => localRegistry.removeConnection(connectionId)
              )
            )
            yield* _(
              Effect.acquireRelease(
                redisRegistry.registerConnection(connectionId, clientInfo),
                () =>
                  redisRegistry.removeConnection(
                    connectionId,
                    clientInfo.notificationToken
                  )
              )
            )

            // Keep the connection alive in redis registry
            yield* _(
              keepAliveAsLongAsScopeInRedisRegistry(connectionId, clientInfo)
            )

            const notificationsWaitingThrottled = yield* _(
              throttledPushNotificationService.getPendingNotificationsAndCancelThrottleTimeout(
                clientInfo.notificationToken
              ),
              Effect.map(Array.map((one) => one.socketMessage)),
              Effect.catchAll(
                (a) =>
                  new UnexpectedServerError({
                    message: 'Failed to get pending notifications',
                    cause: a,
                  })
              )
            )

            return Stream.fromQueue(queue).pipe(
              Stream.tap((e) =>
                Effect.log('Sending event to client', e, connectionInfo)
              ),
              Stream.mapEffect(identity),
              Stream.prepend(Chunk.fromIterable(notificationsWaitingThrottled))
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
