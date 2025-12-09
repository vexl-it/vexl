import {
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {Array, Context, Effect, Layer} from 'effect/index'
import {notificationThrottleTtlMinutesConfig} from '../configs'
import {type VexlNotificationToken} from '../NotificationSocketMessaging/domain'
import {type ThrottlePushNotificationServiceTask} from './doamin'
import {LastTimeIssuedForNotificationTokenDb} from './services/LastTimeIssuedForNotificationTokenDb'
import {NotificationWaitingToBeIssuedForNotificationToken} from './services/NotificationWaitingToBeIssuedForNotificationToken'

export interface ThrottledPushNotificationServiceOperations {
  issuePushNotification: (
    task: ThrottlePushNotificationServiceTask
  ) => Effect.Effect<void>
  getAndCancelPendingTasksForNotificationToken: (
    token: VexlNotificationToken
  ) => Effect.Effect<ThrottlePushNotificationServiceTask[], void>
}

export class ThrottledPushNotificationService extends Context.Tag(
  'ThrottledPushNotificationService'
)<
  ThrottledPushNotificationService,
  ThrottledPushNotificationServiceOperations
>() {
  static Live = Layer.effect(
    ThrottledPushNotificationService,
    Effect.gen(function* (_) {
      const lastTimeIssuedForNotificationTokenDb = yield* _(
        LastTimeIssuedForNotificationTokenDb
      )
      const notificationWaitingToBeIssuedForNotificationTokenDb = yield* _(
        NotificationWaitingToBeIssuedForNotificationToken
      )

      const throttleTtlMs =
        (yield* _(notificationThrottleTtlMinutesConfig)) * 60 * 1000

      const issueNotification = (task: ThrottlePushNotificationServiceTask) =>
        Effect.gen(function* (_) {
          const lastTimeIssued = yield* _(
            lastTimeIssuedForNotificationTokenDb.getLastTimeIssuedForNotificationToken(
              task.token
            ),
            Effect.catchTag('NoSuchElementException', () =>
              Effect.succeed(UnixMilliseconds0)
            )
          )

          // Notification was issued recently, so we throttle it
          // TODO check
          if (lastTimeIssued + throttleTtlMs > Date.now()) {
            yield* _(
              notificationWaitingToBeIssuedForNotificationTokenDb.addNotificationToWaitingList(
                task
              )
            )
          }

          yield* _(
            lastTimeIssuedForNotificationTokenDb.setLastTimeIssuedForNotificationToken(
              task.token,
              unixMillisecondsNow()
            )
          )
          const tasksToSend = yield* _(
            notificationWaitingToBeIssuedForNotificationTokenDb.getAndClearWaitingListForToken(
              task.token
            ),
            Effect.map(Array.append(task))
          )
        })

      return {} as any
    })
  )
}
