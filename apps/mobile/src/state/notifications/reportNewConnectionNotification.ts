import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type MetricsApi} from '@vexl-next/rest-api/src/services/metrics'
import {Effect} from 'effect/index'
import {reportErrorE} from '../../utils/reportError'

export function reportNewConnectionNotificationForked(
  api: MetricsApi
): Effect.Effect<void> {
  return api
    .reportNotificationInteraction({
      count: 1,
      notificationType: 'Network',
      type: 'BackgroundMessageReceived',
      uuid: generateUuid(),
    })
    .pipe(
      Effect.tapError((e) =>
        reportErrorE(
          'warn',
          new Error('Error reporting new connections notification'),
          {e}
        )
      ),
      Effect.forkDaemon
    )
}
