import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {NotificationApiSpecification} from '@vexl-next/rest-api/src/services/notification/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {Effect} from 'effect'
import {NotificationMetricsService} from '../metrics'
import {OfflineNotificationBuffer} from '../services/OfflineNotificationBuffer'

export const reportNotificationProcessedHandler = makeHttpApiHandler(
  NotificationApiSpecification,
  'root',
  'reportNotificationProcessed',
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* () {
        const notificationMetrics = yield* NotificationMetricsService
        const offlineNotificationBuffer = yield* OfflineNotificationBuffer

        // The client processed the notification, so it no longer needs to be
        // replayed when its background socket reconnects.
        yield* offlineNotificationBuffer.removeBufferedTaskByTrackingId(
          req.payload.trackingId
        )

        yield* notificationMetrics.reportNotificationProcessed({
          id: req.payload.trackingId,
          processedAt: unixMillisecondsNow(),
          commonMetricAttributes: commonMetricAttributesFromHeaders(
            req.headers
          ),
        })
        return {}
      })
    )
)
