import {
  VexlNotificationTokenSecret,
  type VexlNotificationToken,
} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {
  UnixMilliseconds0,
  unixMillisecondsNow,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {makeMqService} from '@vexl-next/server-utils/src/mqService'
import {Data, Effect, pipe, Schema} from 'effect'
import {notificationThrottleTtlMinutesConfig} from '../../../configs'
import {PushNotificationService} from '../../PushNotificationService'
import {lockOnNotificationToken} from '../utils'
import {LastTimeIssuedForNotificationTokenDb} from './LastTimeIssuedForNotificationTokenDb'
import {NotificationWaitingToBeIssuedForNotificationToken} from './NotificationWaitingToBeIssuedForNotificationToken'
export {processThrottledNotificationsJobId} from './ThrottledNotificationJobId'

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

const {EnqueueTask, EnqueueTaskContext, producerLayer, consumerLayer} =
  makeMqService(
    THROTTLED_NOTIFICATIONS_PROCESSING_QUEUE_KEY,
    Schema.Struct({token: VexlNotificationTokenSecret})
  )

export const scheduleThrottledNotificationProducerLayer = producerLayer

export const EnqueueProcessNotifications = EnqueueTask

export const EnqueueProcessNotificationsContext = EnqueueTaskContext

export type EnqueueProcessNotificationsContext =
  typeof EnqueueProcessNotificationsContext

export const processThrottledNotificationsWorker = consumerLayer(({token}) =>
  Effect.gen(function* () {
    // Check if notification was issued
    // Get pending notifications for the token and erase throttle timeout
    // send notifications

    const pushNotificationService = yield* PushNotificationService
    const lastTimeIssuedForNotificationTokenDb =
      yield* LastTimeIssuedForNotificationTokenDb
    const notificationsWaitingToBeIssuedDb =
      yield* NotificationWaitingToBeIssuedForNotificationToken
    const throttleTtlMs =
      (yield* notificationThrottleTtlMinutesConfig) * 60 * 1000

    yield* Effect.log('Processing throttled notifications')
    const lastTimeIssued = yield* pipe(
      lastTimeIssuedForNotificationTokenDb.getLastTimeIssuedForNotificationToken(
        token
      ),
      Effect.catchTag('NoSuchElementError', () =>
        Effect.succeed(UnixMilliseconds0)
      )
    )
    if (lastTimeIssued + throttleTtlMs > Date.now()) {
      yield* Effect.log(
        'Skipping processing throttled notifications, still in throttle period'
      )
      return
    }

    yield* lastTimeIssuedForNotificationTokenDb.setLastTimeIssuedForNotificationToken(
      token,
      unixMillisecondsNow()
    )

    const pendingNotifications =
      yield* notificationsWaitingToBeIssuedDb.getAndClearWaitingListForToken(
        token
      )
    if (pendingNotifications.length === 0) {
      yield* Effect.log('No pending notifications found for token')
      return
    }

    yield* Effect.log('Found pending notifications. Issuing', {
      count: pendingNotifications.length,
    })
    yield* pushNotificationService.sendNotificationViaExpoNotification(
      pendingNotifications
    )
  }).pipe(
    lockOnNotificationToken(token),
    Effect.catch((e) => {
      return Effect.logError('Failed to process throttled notifications', e)
    })
  )
)
