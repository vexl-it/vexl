import {type NotificationTrackingId} from '@vexl-next/domain/src/general/NotificationTrackingId.brand'
import {
  type UnixMilliseconds,
  UnixMillisecondsE,
} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {type Effect, Schema} from 'effect'

const NOTIFICATION_SENT = 'NOTIFICATION_SENT'
const NOTIFICATION_PROCESSED = 'NOTIFICATION_PROCESSED'

const AnalyticsRecord = Schema.Struct({
  sentAt: UnixMillisecondsE,
  processedByClientAt: Schema.optionalWith(UnixMillisecondsE, {as: 'Option'}),
  clientVersion: VersionCode,
  clientPlatform: PlatformName,
})
export type AnalyticsRecord = typeof AnalyticsRecord.Type

export const reportNotificationSent = ({
  id,
  clientVersion,
  clientPlatform,
  sentAt,
}: {
  id: NotificationTrackingId
  clientVersion: VersionCode
  sentAt: UnixMilliseconds
  clientPlatform: PlatformName
}): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      timestamp: new Date(),
      name: NOTIFICATION_SENT,
      attributes: {
        trackingId: id,
        clientVersion,
        sentAt,
        clientPlatform,
      },
    })
  )

export const reportNotificationProcessed = ({
  id,
  processedAt,
}: {
  id: NotificationTrackingId
  processedAt: UnixMilliseconds
}): Effect.Effect<void, never, MetricsClientService> =>
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
  )
