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
import {Array, Context, Effect, Layer, pipe} from 'effect'
import {type SchemaError} from 'effect/Schema'
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
    MqServiceError | ExpoSdkError | SchemaError | RedisError | RedisLockError
  >
  getPendingNotificationsAndCancelThrottleTimeout: (
    token: VexlNotificationTokenSecret
  ) => Effect.Effect<
    readonly SupportedPushNotificationTask[],
    RedisError | RedisLockError
  >
}

export class ThrottledPushNotificationService extends Context.Service<
  ThrottledPushNotificationService,
  ThrottledPushNotificationServiceOperations
>()('ThrottledPushNotificationService') {
  static Live = Layer.effect(
    ThrottledPushNotificationService,
    Effect.gen(function* () {
      const pushNotificationService = yield* PushNotificationService
      const lastTimeIssuedForNotificationTokenDb =
        yield* LastTimeIssuedForNotificationTokenDb
      const notificationWaitingToBeIssuedForNotificationTokenDb =
        yield* NotificationWaitingToBeIssuedForNotificationToken

      const redisService = yield* RedisService

      const throttleTtlMinutes = yield* notificationThrottleTtlMinutesConfig
      const throttleEnabled = throttleTtlMinutes !== -1
      const throttleTtlMs = throttleTtlMinutes * 60 * 1000

      const scheduleThrottleSend = yield* EnqueueProcessNotifications

      return {
        issuePushNotification: (task: SupportedPushNotificationTask) =>
          Effect.gen(function* () {
            const lastTimeIssued = yield* pipe(
              lastTimeIssuedForNotificationTokenDb.getLastTimeIssuedForNotificationToken(
                task.notificationToken
              ),
              Effect.catchTag('NoSuchElementError', () =>
                Effect.succeed(UnixMilliseconds0)
              )
            )

            if (
              throttleEnabled &&
              // Notification was issued recently, so we throttle it
              lastTimeIssued + throttleTtlMs > Date.now()
            ) {
              yield* notificationWaitingToBeIssuedForNotificationTokenDb.addNotificationToWaitingList(
                task
              )
            } else {
              yield* pipe(
                notificationWaitingToBeIssuedForNotificationTokenDb.getAndClearWaitingListForToken(
                  task.notificationToken
                ),
                Effect.map(Array.append(task)),
                Effect.flatMap(
                  pushNotificationService.sendNotificationViaExpoNotification
                ),
                Effect.tap(
                  lastTimeIssuedForNotificationTokenDb.setLastTimeIssuedForNotificationToken(
                    task.notificationToken,
                    unixMillisecondsNow()
                  )
                )
              )
            }

            if (throttleEnabled) {
              yield* scheduleThrottleSend(
                {token: task.notificationToken},
                {
                  delay: throttleTtlMs,
                  jobId: processThrottledNotificationsJobId(
                    task.notificationToken
                  ),
                }
              )
            }
          }).pipe(
            lockOnNotificationToken(task.notificationToken),
            Effect.provideService(RedisService, redisService)
          ),
        getPendingNotificationsAndCancelThrottleTimeout: (
          token: VexlNotificationTokenSecret
        ) =>
          Effect.gen(function* () {
            yield* lastTimeIssuedForNotificationTokenDb.deleteLastTimeIssuedForNotificationToken(
              token
            )
            return yield* notificationWaitingToBeIssuedForNotificationTokenDb.getAndClearWaitingListForToken(
              token
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
