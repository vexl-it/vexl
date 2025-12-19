import {
  UnixMilliseconds0,
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {makeMqService} from '@vexl-next/server-utils/src/mqService'
import {Data, Effect, Schema} from 'effect/index'
import {notificationThrottleTtlMinutesConfig} from '../../../configs'
import {VexlNotificationToken} from '../../NotificationSocketMessaging/domain'
import {PushNotificationService} from '../../PushNotificationService'
import {lockOnNotificationToken} from '../utils'
import {LastTimeIssuedForNotificationTokenDb} from './LastTimeIssuedForNotificationTokenDb'
import {NotificationWaitingToBeIssuedForNotificationToken} from './NotificationWaitingToBeIssuedForNotificationToken'

export class ProcessThrottledNotificationsError extends Data.TaggedError(
  'ProcessThrottledNotificationsError'
)<{cause: unknown; message: string}> {}

export interface ProcessThrottledNotificationsOperations {
  scheduleProcessing: (
    token: VexlNotificationToken,
    runAt: UnixMilliseconds
  ) => Effect.Effect<void, ProcessThrottledNotificationsError>
}

const THROTTLED_NOTIFICATIONS_PROCESSING_QUEUE_KEY =
  'notification-service_throttled-notifications-processing-queue'

const {EnqueueTask, producerLayer, consumerLayer} = makeMqService(
  THROTTLED_NOTIFICATIONS_PROCESSING_QUEUE_KEY,
  Schema.Struct({token: VexlNotificationToken})
)

export const scheduleThrottledNotificationProducerLayer = producerLayer

export const EnqueueProcessNotifications = EnqueueTask

export const processThrottledNotificationsWorker = consumerLayer(({token}) =>
  Effect.gen(function* (_) {
    // Check if notification was issued
    // Get pending notifications for the token and erase throttle timeout
    // send notifications

    const pushNotificationService = yield* _(PushNotificationService)
    const lastTimeIssuedForNotificationTokenDb = yield* _(
      LastTimeIssuedForNotificationTokenDb
    )
    const notificationsWaitingToBeIssuedDb = yield* _(
      NotificationWaitingToBeIssuedForNotificationToken
    )
    const throttleTtlMs =
      (yield* _(notificationThrottleTtlMinutesConfig)) * 60 * 1000

    yield* _(
      Effect.log('Processing throttled notifications for token', {token})
    )
    const lastTimeIssued = yield* _(
      lastTimeIssuedForNotificationTokenDb.getLastTimeIssuedForNotificationToken(
        token
      ),
      Effect.catchTag('NoSuchElementException', () =>
        Effect.succeed(UnixMilliseconds0)
      )
    )
    if (lastTimeIssued + throttleTtlMs > Date.now()) {
      yield* _(
        Effect.log(
          'Skipping processing throttled notifications for token, still in throttle period',
          {token}
        )
      )
      return
    }

    yield* _(
      lastTimeIssuedForNotificationTokenDb.setLastTimeIssuedForNotificationToken(
        token,
        unixMillisecondsNow()
      )
    )

    const pendingNotifications = yield* _(
      notificationsWaitingToBeIssuedDb.getAndClearWaitingListForToken(token)
    )
    if (pendingNotifications.length === 0) {
      yield* _(Effect.log('No pending notifications found for token', {token}))
      return
    }
    yield* _(
      Effect.log('Found pending notifications. Issuing', {
        count: pendingNotifications.length,
        token,
      })
    )
    yield* _(
      pushNotificationService.sendNotificationViaExpoNotification(
        pendingNotifications
      )
    )
  }).pipe(
    lockOnNotificationToken(token),
    Effect.catchAll((e) => {
      return Effect.logError('Failed to process throttled notifications', e)
    })
  )
)
