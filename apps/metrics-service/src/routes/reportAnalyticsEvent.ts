import {HttpApiBuilder} from '@effect/platform/index'
import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect} from 'effect/index'
import {MetricsDbService} from '../db/MetricsDbService'

export const reportAnalyticsEventHandler = HttpApiBuilder.handler(
  MetricsApiSpecification,
  'root',
  'reportAnalyticsEvent',
  ({headers, payload}) =>
    Effect.gen(function* (_) {
      const metricsDb = yield* _(MetricsDbService)

      const eventName = `CLIENT_ANALYTICS_${payload.event._tag}`

      yield* _(
        metricsDb.insertMetricRecord({
          name: eventName,
          timestamp: new Date(),
          type: 'Total',
          uuid: payload.event.eventId,
          value: 1,
          attributes: payload.event,
        }),
        Effect.catchTag('MessageWithUuidAlreadyStoredError', () =>
          Effect.zipRight(
            Effect.logInfo('Message with uuid already exists. Not inserting.'),
            Effect.void
          )
        )
      )

      return {}
    }).pipe(makeEndpointEffect)
)
