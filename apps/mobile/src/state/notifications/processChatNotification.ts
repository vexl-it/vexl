import {type NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {type NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {generateUuid, UuidE} from '@vexl-next/domain/src/utility/Uuid.brand'
import {taskToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import {type MetricsApi} from '@vexl-next/rest-api/src/services/metrics'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect, Option, Schema} from 'effect/index'
import {atom} from 'jotai'
import {AppState} from 'react-native'
import {apiAtom} from '../../api'
import {areNotificationsEnabledE} from '../../utils/notifications'
import reportError, {reportErrorE} from '../../utils/reportError'
import {fetchAndStoreMessagesForInboxHandleNotificationsActionAtom} from '../chat/atoms/fetchNewMessagesActionAtom'
import {loadSession} from '../session/loadSession'
import {getKeyHolderForNotificationCypherActionAtom} from './fcmCypherToKeyHolderAtom'

const processChatNotificationProcessed = (
  notificationTrackingId: NotificationTrackingId,
  notificationApi: NotificationApi,
  metricsApi: MetricsApi,
  notificationData: NewChatMessageNoticeNotificationData
): Effect.Effect<void> => {
  return Effect.gen(function* (_) {
    console.info(`Reporting BackgroundMessageReceived`)
    const notificationsEnabled = yield* _(
      areNotificationsEnabledE(),
      Effect.option
    )
    const reportUiNotificationReceivedIfAppInTheForeground = (
      AppState.currentState === 'active' &&
      notificationData.includesSystemNotification
        ? metricsApi.reportNotificationInteraction({
            count: 1,
            notificationType: 'Chat',
            type: 'UINotificationReceived',
            ...(Option.isSome(notificationsEnabled)
              ? {
                  notificationsEnabled:
                    notificationsEnabled.value.notifications,
                  backgroundTaskEnabled:
                    notificationsEnabled.value.backgroundTasks,
                }
              : {}),
            uuid: generateUuid(),
          })
        : Effect.void
    ).pipe(
      Effect.timeout(500),
      Effect.retry({times: 3}),
      Effect.tapError((e) =>
        reportErrorE(
          'warn',
          new Error(
            'Error while sending UI notification processed to metrics from in app event'
          ),
          {
            e,
          }
        )
      ),
      Effect.forkDaemon
    )

    const reportNotificationProcessedToNotificationService = notificationApi
      .reportNotificationProcessed({
        trackingId: notificationTrackingId,
      })
      .pipe(
        Effect.timeout(500),
        Effect.retry({times: 3}),
        Effect.tapError((e) =>
          reportErrorE(
            'warn',
            new Error(
              'Error while sending notification processed to notification'
            ),
            {
              e,
            }
          )
        ),
        Effect.forkDaemon
      )

    const reportNotificationProcessedToMetricsService = metricsApi
      .reportNotificationInteraction({
        count: 1,
        notificationType: 'Chat',
        type: 'BackgroundMessageReceived',
        uuid: Schema.decodeSync(UuidE)(notificationTrackingId),
        ...(Option.isSome(notificationsEnabled)
          ? {
              notificationsEnabled: notificationsEnabled.value.notifications,
              backgroundTaskEnabled: notificationsEnabled.value.backgroundTasks,
            }
          : {}),
        ...(Option.isSome(notificationData.systemNotificationSent)
          ? {
              systemNotificationSent:
                notificationData.systemNotificationSent.value,
            }
          : {}),
        trackingId: notificationTrackingId,
      })
      .pipe(
        Effect.timeout(500),
        Effect.retry({times: 3}),
        Effect.tapError((e) =>
          reportErrorE(
            'warn',
            new Error('Error while sending notification processed to metrics'),
            {
              e,
            }
          )
        ),
        Effect.forkDaemon
      )

    return yield* _(
      Effect.all(
        [
          reportNotificationProcessedToNotificationService,
          reportNotificationProcessedToMetricsService,
          reportUiNotificationReceivedIfAppInTheForeground,
        ],
        {concurrency: 'unbounded'}
      )
    )
  })
}

const processChatNotificationActionAtom = atom(
  null,
  (
    get,
    set,
    notification: NewChatMessageNoticeNotificationData
  ): Effect.Effect<boolean> => {
    return Effect.gen(function* (_) {
      console.info('📩 Refreshing inbox')
      const sessionLoaded = yield* _(taskToEffect(loadSession()))

      if (!sessionLoaded) {
        yield* _(
          reportErrorE(
            'warn',
            new Error(
              'Got notification but no session in storage. Skipping refreshing inbox'
            )
          )
        )
        return false
      }

      const api = get(apiAtom)
      if (Option.isSome(notification.trackingId))
        yield* _(
          processChatNotificationProcessed(
            notification.trackingId.value,
            api.notification,
            api.metrics,
            notification
          )
        )

      const inboxForCypher = set(
        getKeyHolderForNotificationCypherActionAtom,
        notification.targetCypher
      )
      if (!inboxForCypher) {
        reportError(
          'warn',
          new Error(
            'Error decrypting notification FCM - unable to find private key for cypher'
          )
        )
        return false
      }

      const updates = yield* _(
        set(fetchAndStoreMessagesForInboxHandleNotificationsActionAtom, {
          key: inboxForCypher.publicKeyPemBase64,
        })
      )
      return !!updates
    })
  }
)

export default processChatNotificationActionAtom
