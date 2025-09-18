import {type NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type MetricsApi} from '@vexl-next/rest-api/src/services/metrics'
import {Effect, Option} from 'effect/index'
import {areNotificationsEnabledE} from '../../utils/notifications'
import {reportErrorE} from '../../utils/reportError'

export function reportNewConnectionNotificationForked(
  api: MetricsApi,
  trackingId: Option.Option<NotificationTrackingId>
): Effect.Effect<void> {
  return Effect.gen(function* (_) {
    const notificationsEnabled = yield* _(
      areNotificationsEnabledE(),
      Effect.option
    )
    return yield* _(
      api
        .reportNotificationInteraction({
          count: 1,
          notificationType: 'Network',
          type: 'BackgroundMessageReceived',
          trackingId: Option.getOrUndefined(trackingId),
          uuid: generateUuid(),
          ...(Option.isSome(notificationsEnabled)
            ? {
                notificationsEnabled: notificationsEnabled.value.notifications,
                backgroundTaskEnabled:
                  notificationsEnabled.value.backgroundTasks,
              }
            : {}),
        })
        .pipe(
          Effect.timeout(500),
          Effect.retry({times: 3}),
          Effect.tapError((e) =>
            reportErrorE(
              'warn',
              new Error('Error reporting new connections notification'),
              {e}
            )
          ),
          Effect.forkDaemon
        )
    )
  })
}
