import {unixMillisecondsNow} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {ReportNotificationProcessedEndpoint} from '@vexl-next/rest-api/src/services/notification/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Schema} from 'effect'
import {Handler} from 'effect-http'
import {reportNotificationProcessed} from '../metrics'

export const reportNotificationProcessedHandler = Handler.make(
  ReportNotificationProcessedEndpoint,
  (req) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        yield* _(
          reportNotificationProcessed({
            id: req.body.trackingId,
            processedAt: unixMillisecondsNow(),
          })
        )
      }),
      Schema.Void
    )
)
