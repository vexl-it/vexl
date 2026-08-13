import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {RedisPubSubService} from '@vexl-next/server-utils/src/RedisPubSubService'
import {Array, Context, Effect, flow, Layer, pipe} from 'effect/index'
import {
  NoActiveSocketConnectionsError,
  type ConnectionManagerChannelId,
  type NewChatMessageNoticeSendTask,
  type SendMessageTask,
  type StreamOnlyChatMessageSendTask,
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
    | NoActiveSocketConnectionsError
    | UnexpectedServerError
    | SendMessageTasksManagerError
  >
  sendStreamOnlyChatMessage: (
    task: StreamOnlyChatMessageSendTask
  ) => Effect.Effect<
    void,
    | NoActiveSocketConnectionsError
    | UnexpectedServerError
    | SendMessageTasksManagerError
  >
  sendNotice: (
    task: SendMessageTask
  ) => Effect.Effect<
    void,
    | NoActiveSocketConnectionsError
    | UnexpectedServerError
    | SendMessageTasksManagerError
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

      const findManagerIdsForOpenConnections = (
        token: VexlNotificationTokenSecret,
        minimalClientVersion?: VersionCode
      ): Effect.Effect<
        Array.NonEmptyArray<ConnectionManagerChannelId>,
        NoActiveSocketConnectionsError | UnexpectedServerError
      > =>
        pipe(
          registry.getConnectionsForToken(token),
          Effect.map(
            flow(
              Array.filter(
                (c) => c.clientInfo.version >= (minimalClientVersion ?? 0)
              ),
              Array.map((c) => c.managerId),
              Array.dedupe
            )
          ),
          Effect.filterOrFail(Array.isNonEmptyArray),
          Effect.catchTag(
            'NoSuchElementException',
            () => new NoActiveSocketConnectionsError()
          )
        )

      return {
        sendNewChatMessageNotice: (task) =>
          Effect.flatMap(
            findManagerIdsForOpenConnections(
              task.notificationToken,
              task.minimalClientVersion
            ),
            (managerIds) => sendMessageTaskManager.emitTask(task, ...managerIds)
          ),
        sendStreamOnlyChatMessage: (task) =>
          Effect.flatMap(
            findManagerIdsForOpenConnections(
              task.notificationToken,
              task.minimalClientVersion
            ),
            (managerIds) => sendMessageTaskManager.emitTask(task, ...managerIds)
          ),
        sendNotice: (task) =>
          Effect.flatMap(
            findManagerIdsForOpenConnections(
              task.notificationToken,
              task.minimalClientVersion
            ),
            (managerIds) => sendMessageTaskManager.emitTask(task, ...managerIds)
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
