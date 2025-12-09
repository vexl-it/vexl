import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {RedisPubSubService} from '@vexl-next/server-utils/src/RedisPubSubService'
import {NoSuchElementException} from 'effect/Cause'
import {Context, Effect, Layer, pipe} from 'effect/index'
import {
  type ConnectionRedisRecord,
  type NewChatMessageNoticeSendTask,
  type StreamOnlyChatMessageSendTask,
  type VexlNotificationToken,
} from './domain'
import {LocalConnectionRegistry} from './services/LocalConnectionRegistry'
import {MyManagerIdProvider} from './services/MyManagerIdProvider'
import {RedisConnectionRegistry} from './services/RedisConnectionRegistry'
import {SendMessageTasksManager} from './services/SendMessageTasksManager'
import {type SendMessageTasksManagerError} from './services/SendMessageTasksManager/domain'

export interface NotificationSocketMessagingOperations {
  sendNewChatMessageNotice: (
    task: NewChatMessageNoticeSendTask
  ) => Effect.Effect<
    void,
    NoSuchElementException | SendMessageTasksManagerError
  >
  sendStreamOnlyChatMessage: (
    task: StreamOnlyChatMessageSendTask
  ) => Effect.Effect<
    void,
    NoSuchElementException | SendMessageTasksManagerError
  >
}

export class NotificationSocketMessaging extends Context.Tag(
  'NotificationSocketMessaging'
)<NotificationSocketMessaging, NotificationSocketMessagingOperations>() {
  static Live = Layer.effect(
    NotificationSocketMessaging,
    Effect.gen(function* (_) {
      const registry = yield* _(RedisConnectionRegistry)
      const sendMessageTaskManager = yield* _(SendMessageTasksManager)

      const findOpenConnection = (
        token: VexlNotificationToken,
        minimalClientVersion?: VersionCode
      ): Effect.Effect<ConnectionRedisRecord, NoSuchElementException> =>
        pipe(
          registry.getConnectionForToken(token),
          Effect.filterOrFail(
            (connection): boolean =>
              connection.clientInfo.version >= (minimalClientVersion ?? 0),
            () => new NoSuchElementException()
          ),
          Effect.catchTag(
            'UnexpectedServerError',
            () => new NoSuchElementException()
          )
        )

      return {
        sendNewChatMessageNotice: (task) =>
          Effect.flatMap(
            findOpenConnection(
              task.notificationToken,
              task.minimalClientVersion
            ),
            (connectionMetadata) =>
              sendMessageTaskManager.emitTask(
                task,
                connectionMetadata.managerId
              )
          ),
        sendStreamOnlyChatMessage: (task) =>
          Effect.flatMap(
            findOpenConnection(
              task.notificationToken,
              task.minimalClientVersion
            ),
            (connection) =>
              sendMessageTaskManager.emitTask(task, connection.managerId)
          ),
      }
    })
  ).pipe(
    Layer.provideMerge(
      SendMessageTasksManager.layer({
        timeout: '30 seconds',
      })
    ),
    Layer.provideMerge(RedisPubSubService.Live),
    Layer.provideMerge(RedisConnectionRegistry.Live),
    Layer.provideMerge(LocalConnectionRegistry.Live),
    Layer.provideMerge(MyManagerIdProvider.Live)
  )
}
