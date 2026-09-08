import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {isVexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
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
  Order,
  pipe,
  Queue,
  Result,
  Schedule,
  Stream,
} from 'effect'
import {type Scope} from 'effect/Scope'
import {type SupportedPushNotificationTask} from '../../../domain'
import {NotificationMetricsService} from '../../../metrics'
import {OfflineNotificationBuffer} from '../../OfflineNotificationBuffer'
import {ThrottledPushNotificationService} from '../../ThrottledPushNotificationService'
import {createTemporaryVexlNotificationTokenSecret} from '../../VexlNotificationTokenService/utils'
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
  Effect.gen(function* () {
    const localRegistry = yield* LocalConnectionRegistry
    const redisRegistry = yield* RedisConnectionRegistry
    const throttledPushNotificationService =
      yield* ThrottledPushNotificationService
    const offlineNotificationBuffer = yield* OfflineNotificationBuffer
    const notificationMetrics = yield* NotificationMetricsService

    return {
      listenToNotifications: (connectionInfo) =>
        Stream.unwrap(
          Effect.gen(function* () {
            // TODO #2124 - use token from info directly
            const vexlNotificationToken = isVexlNotificationTokenSecret(
              connectionInfo.notificationToken
            )
              ? connectionInfo.notificationToken
              : createTemporaryVexlNotificationTokenSecret(
                  connectionInfo.notificationToken
                )

            const connectionId = newStreamConnectionId()
            const clientInfo: ClientInfo = {
              notificationToken: vexlNotificationToken,
              platform: connectionInfo.platform,
              version: connectionInfo.version,
              connectionKind: connectionInfo.connectionKind,
            }

            yield* Effect.acquireRelease(
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

            const queue = yield* Effect.acquireRelease(
              Queue.sliding<
                Result.Result<
                  NotificationStreamMessage,
                  NotificationStreamError
                >
              >(42),
              Queue.shutdown
            )

            const send = (
              message: NotificationStreamMessage
            ): Effect.Effect<boolean> =>
              Queue.offer(queue, Result.succeed(message))

            const kickOut = (
              error?: NotificationStreamError
            ): Effect.Effect<boolean> =>
              Queue.offer(
                queue,
                Result.fail(
                  error ??
                    new UnexpectedServerError({
                      cause: 'kicked out',
                      message: 'Kicked out by server',
                    })
                )
              )

            // Register connection in both local and redis registries
            yield* Effect.acquireRelease(
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
            yield* Effect.acquireRelease(
              redisRegistry.registerConnection(connectionId, clientInfo),
              () =>
                redisRegistry.removeConnection(
                  connectionId,
                  clientInfo.notificationToken
                )
            )

            // Keep the connection alive in redis registry
            yield* keepAliveAsLongAsScopeInRedisRegistry(
              connectionId,
              clientInfo
            )

            // Heartbeat to prevent connection from timing out.
            yield* send(new DebugMessage({})).pipe(
              Effect.schedule(Schedule.spaced('30 seconds')),
              Effect.forkScoped
            )

            const notificationsWaitingThrottled = yield* pipe(
              throttledPushNotificationService.getPendingNotificationsAndCancelThrottleTimeout(
                clientInfo.notificationToken
              ),
              Effect.catch(
                (a) =>
                  new UnexpectedServerError({
                    message: 'Failed to get pending notifications',
                    cause: a,
                  })
              )
            )

            // An open app syncs all its data itself, so a foreground
            // connection makes the offline buffer moot.
            const notificationsBufferedWhileOffline = yield* pipe(
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
              Effect.catch((e) =>
                Effect.andThen(
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
                  Order.Number,
                  (task: SupportedPushNotificationTask) => task.sentAt
                )
              ),
              Array.filter((task) =>
                canDeliverTaskToConnection(task, clientInfo)
              )
            )

            yield* Effect.forEach(
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

            return Stream.fromQueue(queue).pipe(
              Stream.tap((e) =>
                Result.isSuccess(e) && e.success._tag === 'DebugMessage'
                  ? Effect.void
                  : Effect.log('Sending notification stream event')
              ),
              Stream.mapEffect(Effect.fromResult),
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
