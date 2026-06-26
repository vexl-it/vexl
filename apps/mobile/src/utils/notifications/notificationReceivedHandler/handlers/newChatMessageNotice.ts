import {type NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {type NewChatMessageNoticeNotificationData} from '@vexl-next/domain/src/general/notifications'
import {generateUuid, Uuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type MetricsApi} from '@vexl-next/rest-api/src/services/metrics'
import {type NotificationApi} from '@vexl-next/rest-api/src/services/notification'
import {Effect, Option, Schema} from 'effect/index'
import {getDefaultStore} from 'jotai'
import {AppState} from 'react-native'
import {areNotificationsEnabledE} from '../..'
import {apiAtom} from '../../../../api'
import {fetchAndStoreMessagesForInboxHandleNotificationsActionAtom} from '../../../../state/chat/atoms/fetchNewMessagesActionAtom'
import {getKeyHolderForNotificationTokenOrCypherActionAtom} from '../../../../state/notifications/fcmCypherToKeyHolderAtom'
import reportError, {reportErrorE} from '../../../reportError'

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
        uuid: Schema.decodeSync(Uuid)(notificationTrackingId),
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

export function handleNewChatMessageNoticeNotification(
  notificationData: NewChatMessageNoticeNotificationData
): Effect.Effect<void> {
  // If app is open, we can skipp this. There is already a scoket connected + we fetch the notifications on start
  if (AppState.currentState === 'active') return Effect.void

  return Effect.gen(function* (_) {
    console.info(`Refreshing inbox`)

    const store = getDefaultStore()
    const api = store.get(apiAtom)

    if (Option.isSome(notificationData.trackingId))
      yield* _(
        processChatNotificationProcessed(
          notificationData.trackingId.value,
          api.notification,
          api.metrics,
          notificationData
        )
      )

    // Disable for now
    // if (notificationData.includesSystemNotification) return false

    const inboxForCypher = store.set(
      getKeyHolderForNotificationTokenOrCypherActionAtom,
      notificationData.targetToken ?? notificationData.targetCypher
    )
    if (!inboxForCypher) {
      reportError(
        'warn',
        new Error(
          'Error decrypting notification FCM - unable to find private key for cypher'
        )
      )
      return
    }

    yield* _(
      store.set(fetchAndStoreMessagesForInboxHandleNotificationsActionAtom, {
        key: inboxForCypher.publicKeyPemBase64,
      })
    )
  })
}
