import {Array, Context, Effect, flow, identity, Layer, pipe} from 'effect/index'
import {NotificationMetricsService} from '../../../metrics'
import {OfflineNotificationBuffer} from '../../OfflineNotificationBuffer'
import {ThrottledPushNotificationService} from '../../ThrottledPushNotificationService'
import {type SendMessageTask} from '../domain'
import {canDeliverTaskToConnection} from '../utils'
import {LocalConnectionRegistry} from './LocalConnectionRegistry'

export class TaskProcessor extends Context.Tag('TaskProcessor')<
  TaskProcessor,
  (task: SendMessageTask) => Effect.Effect<boolean>
>() {
  static Live = Layer.effect(
    TaskProcessor,
    Effect.gen(function* (_) {
      const localConnectionRegistry = yield* _(LocalConnectionRegistry)
      const notificationMetrics = yield* _(NotificationMetricsService)

      return (task: SendMessageTask) =>
        pipe(
          localConnectionRegistry.findConnectionForNotificationToken(
            task.notificationToken
          ),
          Effect.map(
            Array.filter((connection) =>
              canDeliverTaskToConnection(task, connection.connectionInfo)
            )
          ),
          Effect.flatMap(
            flow(
              Array.map((connection) =>
                connection.send(task.socketMessage).pipe(
                  Effect.tap((sent) => {
                    if (
                      !sent ||
                      task._tag === 'StreamOnlyChatMessageSendTask'
                    ) {
                      return Effect.void
                    }

                    return notificationMetrics.reportNotificationSent({
                      id: task.trackingId,
                      clientVersion: connection.connectionInfo.version,
                      sentAt: task.sentAt,
                      systemNotificationSent: false,
                      clientPlatform: connection.connectionInfo.platform,
                      channel:
                        connection.connectionInfo.connectionKind ===
                        'foreground'
                          ? 'foreground_socket'
                          : 'background_socket',
                    })
                  })
                )
              ),
              Effect.allWith({concurrency: 'unbounded'})
            )
          ),
          Effect.map(Array.some(identity)),
          Effect.catchTag('NoSuchElementException', () => Effect.succeed(false))
        )
    })
  )
}

export class TimeoutProcessor extends Context.Tag('TimeoutProcessor')<
  TimeoutProcessor,
  (task: SendMessageTask) => Effect.Effect<void>
>() {
  static Live = Layer.effect(
    TimeoutProcessor,
    Effect.gen(function* (_) {
      const {issuePushNotification} = yield* _(ThrottledPushNotificationService)
      const offlineNotificationBuffer = yield* _(OfflineNotificationBuffer)

      return (task: SendMessageTask) =>
        task._tag === 'StreamOnlyChatMessageSendTask'
          ? Effect.void
          : pipe(
              offlineNotificationBuffer.bufferTaskIfEnabled(task),
              Effect.zipRight(issuePushNotification(task)),
              Effect.tapError((e) =>
                Effect.logError(
                  'Failed to issue push notification for timed out socket message',
                  e,
                  {taskType: task._tag}
                )
              ),
              Effect.ignore
            )
    })
  )
}

export const TaskProcessorsLive = Layer.mergeAll(
  TaskProcessor.Live,
  TimeoutProcessor.Live
)
