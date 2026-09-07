import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {makeHttpApiHandler} from '@vexl-next/server-utils/src/makeHttpApiHandler'
import {commonMetricAttributesFromHeaders} from '@vexl-next/server-utils/src/metrics/commonMetricAttributesFromHeaders'
import {Effect, Option} from 'effect'
import {MetricsDbService} from '../db/MetricsDbService'

export const reportNotificationInteraction = makeHttpApiHandler(
  MetricsApiSpecification,
  'root',
  'reportNotificationInteraction',
  ({headers, query}) =>
    Effect.gen(function* () {
      const dataToSave = {
        ...commonMetricAttributesFromHeaders(headers),
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

      const metricsDb = yield* MetricsDbService
      yield* metricsDb.insertMetricRecord({
        name: eventName,
        timestamp: new Date(),
        type: 'Increment',
        uuid: query.uuid,
        value: query.count,
        attributes: dataToSave,
      })

      return {}
    }).pipe(makeEndpointEffect)
)
