import {type VexlNotificationTokenSecret} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  UnixMilliseconds0,
  unixMillisecondsNow,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {type MqServiceError} from '@vexl-next/server-utils/src/mqService'
import {
  RedisService,
  type RedisError,
  type RedisLockError,
} from '@vexl-next/server-utils/src/RedisService'
import {Array, Context, Effect, Layer} from 'effect/index'
import {type ParseError} from 'effect/ParseResult'
import {notificationThrottleTtlMinutesConfig} from '../../configs'
import {type SupportedPushNotificationTask} from '../../domain'
import {PushNotificationService} from '../PushNotificationService'
import {type ExpoSdkError} from '../PushNotificationService/services/ExpoClientService/utils'
import {LastTimeIssuedForNotificationTokenDb} from './services/LastTimeIssuedForNotificationTokenDb'
import {NotificationWaitingToBeIssuedForNotificationToken} from './services/NotificationWaitingToBeIssuedForNotificationToken'
import {
  EnqueueProcessNotifications,
  processThrottledNotificationsJobId,
  scheduleThrottledNotificationProducerLayer,
} from './services/ThrottledNotificationMq'
import {lockOnNotificationToken} from './utils'

export interface ThrottledPushNotificationServiceOperations {
  issuePushNotification: (
    task: SupportedPushNotificationTask
  ) => Effect.Effect<
    void,
    MqServiceError | ExpoSdkError | ParseError | RedisError | RedisLockError
  >
  getPendingNotificationsAndCancelThrottleTimeout: (
    token: VexlNotificationTokenSecret
  ) => Effect.Effect<
    readonly SupportedPushNotificationTask[],
    RedisError | RedisLockError
  >
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
      const pushNotificationService = yield* _(PushNotificationService)
      const lastTimeIssuedForNotificationTokenDb = yield* _(
        LastTimeIssuedForNotificationTokenDb
      )
      const notificationWaitingToBeIssuedForNotificationTokenDb = yield* _(
        NotificationWaitingToBeIssuedForNotificationToken
      )

      const redisService = yield* _(RedisService)

      const throttleTtlMs =
        (yield* _(notificationThrottleTtlMinutesConfig)) * 60 * 1000

      const scheduleThrottleSend = yield* _(EnqueueProcessNotifications)

      return {
        issuePushNotification: (task: SupportedPushNotificationTask) =>
          Effect.gen(function* (_) {
            const lastTimeIssued = yield* _(
              lastTimeIssuedForNotificationTokenDb.getLastTimeIssuedForNotificationToken(
                task.notificationToken
              ),
              Effect.catchTag('NoSuchElementException', () =>
                Effect.succeed(UnixMilliseconds0)
              )
            )

            yield* _(
              Effect.log('Notification Debug: issuePushNotification start', {
                lastTimeIssued,
                taskId: task.id,
                taskTag: task._tag,
                token: task.notificationToken,
                throttleTtlMs,
              })
            )

            // Notification was issued recently, so we throttle it
            if (lastTimeIssued + throttleTtlMs > Date.now()) {
              yield* _(
                notificationWaitingToBeIssuedForNotificationTokenDb.addNotificationToWaitingList(
                  task
                ),
                Effect.tap(() =>
                  Effect.log(
                    'Notification Debug: Notification throttled and added to waiting list',
                    {
                      taskId: task.id,
                      taskTag: task._tag,
                      token: task.notificationToken,
                    }
                  )
                )
              )
            } else {
              yield* _(
                notificationWaitingToBeIssuedForNotificationTokenDb.getAndClearWaitingListForToken(
                  task.notificationToken
                ),
                Effect.map(Array.append(task)),
                Effect.tap((tasksToSend) =>
                  Effect.log(
                    'Notification Debug: Sending push notifications immediately',
                    {
                      count: tasksToSend.length,
                      taskId: task.id,
                      taskTag: task._tag,
                      token: task.notificationToken,
                    }
                  )
                ),
                Effect.flatMap(
                  pushNotificationService.sendNotificationViaExpoNotification
                ),
                Effect.zipLeft(
                  lastTimeIssuedForNotificationTokenDb.setLastTimeIssuedForNotificationToken(
                    task.notificationToken,
                    unixMillisecondsNow()
                  )
                )
              )
            }

            yield* _(
              scheduleThrottleSend(
                {token: task.notificationToken},
                {
                  delay: throttleTtlMs,
                  jobId: processThrottledNotificationsJobId(
                    task.notificationToken
                  ),
                }
              ),
              Effect.tap((job) =>
                Effect.log(
                  'Notification Debug: Scheduled throttle processing job',
                  {
                    jobId: job.id,
                    taskId: task.id,
                    taskTag: task._tag,
                    token: task.notificationToken,
                  }
                )
              )
            )
          }).pipe(
            lockOnNotificationToken(task.notificationToken),
            Effect.provideService(RedisService, redisService)
          ),
        getPendingNotificationsAndCancelThrottleTimeout: (
          token: VexlNotificationTokenSecret
        ) =>
          Effect.gen(function* (_) {
            yield* _(
              lastTimeIssuedForNotificationTokenDb.deleteLastTimeIssuedForNotificationToken(
                token
              )
            )
            return yield* _(
              notificationWaitingToBeIssuedForNotificationTokenDb.getAndClearWaitingListForToken(
                token
              )
            )
          }).pipe(
            lockOnNotificationToken(token),
            Effect.provideService(RedisService, redisService)
          ),
      }
    })
  ).pipe(
    Layer.provideMerge(PushNotificationService.Live),
    Layer.provideMerge(LastTimeIssuedForNotificationTokenDb.Live),
    Layer.provideMerge(NotificationWaitingToBeIssuedForNotificationToken.Live),
    Layer.provide(scheduleThrottledNotificationProducerLayer)
  )
}
