import {type NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {
  UnixMillisecondsE,
  type UnixMilliseconds,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {Context, Effect, Layer, Schema} from 'effect'

const NOTIFICATION_SENT = 'NOTIFICATION_SENT'
const NOTIFICATION_PROCESSED = 'NOTIFICATION_PROCESSED'

const AnalyticsRecord = Schema.Struct({
  sentAt: UnixMillisecondsE,
  processedByClientAt: Schema.optionalWith(UnixMillisecondsE, {as: 'Option'}),
  clientVersion: VersionCode,
  clientPlatform: PlatformName,
})
export type AnalyticsRecord = typeof AnalyticsRecord.Type

export interface NotificationMetricsServiceOperations {
  reportNotificationSent: (args: {
    id: NotificationTrackingId
    clientVersion: VersionCode
    sentAt: UnixMilliseconds
    systemNotificationSent: boolean
    clientPlatform: PlatformName
  }) => Effect.Effect<void>

  reportNotificationProcessed: (args: {
    id: NotificationTrackingId
    processedAt: UnixMilliseconds
  }) => Effect.Effect<void>
}

export class NotificationMetricsService extends Context.Tag(
  'NotificationMetricsService'
)<NotificationMetricsService, NotificationMetricsServiceOperations>() {
  static readonly Live = Layer.effect(
    NotificationMetricsService,
    Effect.gen(function* (_) {
      const metricsClient = yield* _(MetricsClientService)

      return {
        reportNotificationSent: ({
          id,
          clientVersion,
          clientPlatform,
          systemNotificationSent,
          sentAt,
        }) =>
          reportMetricForked(
            new MetricsMessage({
              uuid: generateUuid(),
              timestamp: new Date(),
              name: NOTIFICATION_SENT,
              attributes: {
                trackingId: id,
                clientVersion,
                systemNotificationSent,
                sentAt,
                clientPlatform,
              },
            })
          ).pipe(Effect.provideService(MetricsClientService, metricsClient)),

        reportNotificationProcessed: ({id, processedAt}) =>
          reportMetricForked(
            new MetricsMessage({
              uuid: generateUuid(),
              timestamp: new Date(),
              name: NOTIFICATION_PROCESSED,
              attributes: {
                trackingId: id,
                processedAt,
              },
            })
          ).pipe(Effect.provideService(MetricsClientService, metricsClient)),
      }
    })
  )
}
