import {ReportNotificationInteractionEndpoint} from '@vexl-next/rest-api/src/services/metrics/specification'
import makeEndpointEffect from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Handler} from 'effect-http'
import {Effect, Option, Schema} from 'effect/index'
import {MetricsDbService} from '../db/MetricsDbService'

export const reportNotificationInteraction = Handler.make(
  ReportNotificationInteractionEndpoint,
  ({headers, query}) =>
    makeEndpointEffect(
      Effect.gen(function* (_) {
        const dataToSave = {
          clientVersion: Option.getOrElse(
            headers.clientVersionOrNone,
            () => 'UNKNOWN'
          ),
          clientPlatform: Option.getOrElse(
            headers.clientPlatformOrNone,
            () => 'UNKNOWN'
          ),
          ...(query.notificationsEnabled
            ? {notificationsEnabled: query.notificationsEnabled}
            : {}),
          ...(query.backgroundTaskEnabled
            ? {backgroundTaskEnabled: query.backgroundTaskEnabled}
            : {}),
          ...(query.trackingId ? {trackingId: query.trackingId} : {}),
          ...(query.isVisible ? {isVisible: query.isVisible} : {}),
          ...(query.systemNotificationSent
            ? {systemNotificationSent: query.systemNotificationSent}
            : {}),
        }

        const eventName = `NOTIFICATION_INTERACTION_${query.notificationType}_${query.type}`

        const metricsDb = yield* _(MetricsDbService)
        yield* _(
          metricsDb.insertMetricRecord({
            name: eventName,
            timestamp: new Date(),
            type: 'Increment',
            uuid: query.uuid,
            value: query.count,
            attributes: dataToSave,
          }),
          Effect.catchTag('MessageWithUuidAlreadyStoredError', () =>
            Effect.zipRight(
              Effect.logInfo(
                'Message with uuid already exists. Not inserting.'
              ),
              Effect.void
            )
          )
        )

        return {}
      }),
      Schema.Void
    )
)
