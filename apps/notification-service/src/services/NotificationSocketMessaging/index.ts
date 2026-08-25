import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {RedisPubSubService} from '@vexl-next/server-utils/src/RedisPubSubService'
import {Array, Context, Effect, flow, Layer, pipe} from 'effect/index'
import {
  NoActiveSocketConnectionsError,
  type NewChatMessageNoticeSendTask,
  type SendMessageTask,
  type StreamOnlyChatMessageSendTask,
} from './domain'
import {LocalConnectionRegistry} from './services/LocalConnectionRegistry'
import {MyManagerIdProvider} from './services/MyManagerIdProvider'
import {RedisConnectionRegistry} from './services/RedisConnectionRegistry'
import {SendMessageTasksManager} from './services/SendMessageTasksManager'
import {type SendMessageTasksManagerError} from './services/SendMessageTasksManager/domain'
import {canDeliverTaskToConnection} from './utils'

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

      const emitToOpenConnections = (
        task: SendMessageTask
      ): Effect.Effect<
        void,
        | NoActiveSocketConnectionsError
        | UnexpectedServerError
        | SendMessageTasksManagerError
      > =>
        pipe(
          registry.getConnectionsForToken(task.notificationToken),
          Effect.map(
            flow(
              Array.filter((c) =>
                canDeliverTaskToConnection(task, c.clientInfo)
              ),
              Array.map((c) => c.managerId),
              Array.dedupe
            )
          ),
          Effect.filterOrFail(Array.isNonEmptyArray),
          Effect.catchTag(
            'NoSuchElementException',
            () => new NoActiveSocketConnectionsError()
          ),
          Effect.flatMap((managerIds) =>
            sendMessageTaskManager.emitTask(task, ...managerIds)
          )
        )

      return {
        sendNewChatMessageNotice: emitToOpenConnections,
        sendStreamOnlyChatMessage: emitToOpenConnections,
        sendNotice: emitToOpenConnections,
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
