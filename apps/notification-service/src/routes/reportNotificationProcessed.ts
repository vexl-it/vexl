import {HttpApiBuilder} from '@effect/platform/index'
import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {Effect} from 'effect'
import {NotificationMetricsService} from '../metrics'
import {OfflineNotificationBuffer} from '../services/OfflineNotificationBuffer'

export const reportNotificationProcessedHandler = HttpApiBuilder.handler(
  NotificationApiSpecification,
  'root',
  'reportNotificationProcessed',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const notificationMetrics = yield* _(NotificationMetricsService)
        const offlineNotificationBuffer = yield* _(OfflineNotificationBuffer)

        // The client processed the notification, so it no longer needs to be
        // replayed when its background socket reconnects.
        yield* _(
          offlineNotificationBuffer.removeBufferedTaskByTrackingId(
            req.payload.trackingId
          )
        )

        yield* _(
          notificationMetrics.reportNotificationProcessed({
            id: req.payload.trackingId,
            processedAt: unixMillisecondsNow(),
            commonMetricAttributes: commonMetricAttributesFromHeaders(
              req.headers
            ),
          })
        )
        return {}
      })
    )
)
