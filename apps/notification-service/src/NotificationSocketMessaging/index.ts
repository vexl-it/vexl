import {type StreamOnlyMessageCypher} from '@vexl-next/domain/src/general/messaging'
import {type NotificationCypher} from '@vexl-next/domain/src/general/notifications/NotificationCypher.brand'
import {type ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {type VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {type NewChatMessageNoticeMessage} from '@vexl-next/rest-api/src/services/notification/Rpcs'
import {RedisPubSubService} from '@vexl-next/server-utils/src/RedisPubSubService'
import {NoSuchElementException} from 'effect/Cause'
import {Array, Context, Effect, flow, Layer, pipe} from 'effect/index'
import {
  type ConnectionManagerChannelId,
  NewChatMessageNoticeSendTask,
  StreamOnlyChatMessageSendTask,
  type VexlNotificationToken,
  vexlNotificationTokenFromExpoToken,
} from './domain'
import {LocalConnectionRegistry} from './services/LocalConnectionRegistry'
import {MyManagerIdProvider} from './services/MyManagerIdProvider'
import {RedisConnectionRegistry} from './services/RedisConnectionRegistry'
import {SendMessageTasksManager} from './services/SendMessageTasksManager'
import {type SendMessageTasksManagerError} from './services/SendMessageTasksManager/domain'

export interface NotificationSocketMessagingOperations {
  sendNewChatMessageNotice: (
    expoToken: ExpoNotificationToken,
    message: NewChatMessageNoticeMessage,
    sendSystemNotificationWithFallback: boolean,
    opts?: {minimalClientVersion?: VersionCode}
  ) => Effect.Effect<
    void,
    NoSuchElementException | SendMessageTasksManagerError
  >
  sendStreamOnlyChatMessage: (
    vexlToken: VexlNotificationToken,
    message: StreamOnlyMessageCypher,
    targetCypher: NotificationCypher,
    opts?: {minimalClientVersion?: VersionCode}
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

      const findManagerIdsForOpenConnections = (
        token: VexlNotificationToken,
        minimalClientVersion?: VersionCode
      ): Effect.Effect<
        Array.NonEmptyArray<ConnectionManagerChannelId>,
        NoSuchElementException
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
            'UnexpectedServerError',
            () => new NoSuchElementException()
          )
        )

      const sendStreamOnlyChatMessage: NotificationSocketMessagingOperations['sendStreamOnlyChatMessage'] =
        (vexlToken, message, targetCypher, opts) =>
          Effect.gen(function* (_) {
            const task = new StreamOnlyChatMessageSendTask({
              notificationToken: vexlToken,
              targetCypher,
              message,
              minimalClientVersion: opts?.minimalClientVersion,
            })

            const managerIdsToEmitTo = yield* _(
              findManagerIdsForOpenConnections(
                vexlToken,
                opts?.minimalClientVersion
              )
            )

            yield* _(
              sendMessageTaskManager.emitTask(task, ...managerIdsToEmitTo)
            )
          })

      const sendNewChatMessageNotice: NotificationSocketMessagingOperations['sendNewChatMessageNotice'] =
        (expoToken, message, sendSystemNotificationWithFallback, opts = {}) =>
          Effect.gen(function* (_) {
            const token = vexlNotificationTokenFromExpoToken(expoToken)

            const managerIdsToEmitTo = yield* _(
              findManagerIdsForOpenConnections(token, opts.minimalClientVersion)
            )
            const task = new NewChatMessageNoticeSendTask({
              notificationToken: token,
              targetCypher: message.targetCypher,
              sendNewChatMessageNotification:
                sendSystemNotificationWithFallback,
              sentAt: message.sentAt,
              trackingId: message.trackingId,
              minimalClientVersion: opts.minimalClientVersion,
            })

            yield* _(
              sendMessageTaskManager.emitTask(task, ...managerIdsToEmitTo)
            )
          })

      return {
        sendNewChatMessageNotice,
        sendStreamOnlyChatMessage,
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
