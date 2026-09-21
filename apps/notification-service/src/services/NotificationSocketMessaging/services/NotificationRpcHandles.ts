import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {
  DebugMessage,
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
  Order,
  pipe,
  Queue,
  Schedule,
  Stream,
} from 'effect/index'
import {type Scope} from 'effect/Scope'
import {type SupportedPushNotificationTask} from '../../../domain'
import {NotificationMetricsService} from '../../../metrics'
import {OfflineNotificationBuffer} from '../../OfflineNotificationBuffer'
import {ThrottledPushNotificationService} from '../../ThrottledPushNotificationService'
import {
  type ClientInfo,
  newStreamConnectionId,
  type StreamConnectionId,
} from '../domain'
import {canDeliverTaskToConnection} from '../utils'
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
    const offlineNotificationBuffer = yield* _(OfflineNotificationBuffer)
    const notificationMetrics = yield* _(NotificationMetricsService)

    return {
      listenToNotifications: (connectionInfo) =>
        Stream.unwrapScoped(
          Effect.gen(function* (_) {
            const connectionId = newStreamConnectionId()
            const clientInfo: ClientInfo = connectionInfo

            yield* _(
              Effect.acquireRelease(
                Effect.log(
                  'New notification stream connection established',
                  connectionId,
                  connectionInfo.platform,
                  connectionInfo.version,
                  connectionInfo.connectionKind
                ),
                () =>
                  Effect.log(
                    'Notification stream connection closed',
                    connectionId,
                    connectionInfo.platform,
                    connectionInfo.version,
                    connectionInfo.connectionKind
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
                  {connectionInfo, send, kickOut},
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

            // Heartbeat to prevent connection from timing out.
            yield* _(
              send(new DebugMessage({})).pipe(
                Effect.schedule(Schedule.spaced('30 seconds')),
                Effect.forkScoped
              )
            )

            const notificationsWaitingThrottled = yield* _(
              throttledPushNotificationService.getPendingNotificationsAndCancelThrottleTimeout(
                clientInfo.notificationToken
              ),
              Effect.catchAll(
                (a) =>
                  new UnexpectedServerError({
                    message: 'Failed to get pending notifications',
                    cause: a,
                  })
              )
            )

            // An open app syncs all its data itself, so a foreground
            // connection makes the offline buffer moot.
            const notificationsBufferedWhileOffline = yield* _(
              clientInfo.connectionKind === 'background'
                ? offlineNotificationBuffer.getAndClearBufferedTasks(
                    clientInfo.notificationToken
                  )
                : Effect.as(
                    offlineNotificationBuffer.clearBufferedTasks(
                      clientInfo.notificationToken
                    ),
                    Array.empty<SupportedPushNotificationTask>()
                  ),
              Effect.catchAll((e) =>
                Effect.zipRight(
                  Effect.logError(
                    'Failed to read offline notification buffer',
                    {
                      errorTag: e._tag,
                    }
                  ),
                  Effect.succeed(Array.empty<SupportedPushNotificationTask>())
                )
              )
            )

            // A task can be both throttle-waitlisted and offline-buffered,
            // hence the dedupe by task id.
            const notificationsToReplay = pipe(
              Array.appendAll(
                notificationsWaitingThrottled,
                notificationsBufferedWhileOffline
              ),
              Array.dedupeWith((a, b) => a.id === b.id),
              Array.sortBy(
                Order.mapInput(
                  Order.number,
                  (task: SupportedPushNotificationTask) => task.sentAt
                )
              ),
              Array.filter((task) =>
                canDeliverTaskToConnection(task, clientInfo)
              )
            )

            yield* _(
              Effect.forEach(
                notificationsToReplay,
                (task) =>
                  notificationMetrics.reportNotificationSent({
                    id: task.trackingId,
                    clientVersion: clientInfo.version,
                    sentAt: task.sentAt,
                    systemNotificationSent: false,
                    clientPlatform: clientInfo.platform,
                    channel:
                      clientInfo.connectionKind === 'foreground'
                        ? 'foreground_socket'
                        : 'background_socket',
                  }),
                {discard: true}
              )
            )

            return Stream.fromQueue(queue).pipe(
              Stream.tap((e) =>
                Either.isRight(e) && e.right._tag === 'DebugMessage'
                  ? Effect.void
                  : Effect.log('Sending notification stream event')
              ),
              Stream.mapEffect(identity),
              Stream.prepend(
                Chunk.fromIterable(
                  Array.map(notificationsToReplay, (task) => task.socketMessage)
                )
              )
            )
          })
        ).pipe(
          Stream.withSpan('NotificationStream', {
            attributes: {
              platform: connectionInfo.platform,
              version: connectionInfo.version,
              connectionKind: connectionInfo.connectionKind,
            },
          })
        ),
    }
  })
)
