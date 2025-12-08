import {HttpApiBuilder} from '@effect/platform/index'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect'
import {NotificationMetricsService} from '../metrics'

export const reportNotificationProcessedHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'reportNotificationProcessed',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const notificationMetrics = yield* _(NotificationMetricsService)
        yield* _(
          notificationMetrics.reportNotificationProcessed({
            id: req.payload.trackingId,
            processedAt: unixMillisecondsNow(),
          })
        )
        return {}
      })
    )
)
