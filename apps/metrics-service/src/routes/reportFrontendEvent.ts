import {HttpApiBuilder} from '@effect/platform/index'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {type CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  type FrontendEvent,
  type ReportFrontendEventRequest,
} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Match, Option} from 'effect/index'
import {MetricsDbService} from '../db/MetricsDbService'
import {type InsertMetricsParams} from '../db/MetricsDbService/queries/createInsertMetricRecord'

const MAX_TIMESTAMP_JITTER_MS = 30 * 60 * 1000
const metricTypeIncrement = 'Increment'

export function frontendEventToMetricName(event: FrontendEvent): string {
  return Match.value(event).pipe(
    Match.when('offerRequested', () => 'FE_OFFER_REQUESTED'),
    Match.when('offerRequestDenied', () => 'FE_OFFER_REQUEST_DENIED'),
    Match.when('offerRequestAccepted', () => 'FE_OFFER_REQUEST_ACCEPTED'),
    Match.when('offerRerequested', () => 'FE_OFFER_REREQUESTED'),
    Match.when(
      'offerRequestAcceptedByOtherSide',
      () => 'FE_OFFER_REQUEST_ACCEPTED_BY_OTHER_SIDE'
    ),
    Match.when('chatClosed', () => 'FE_CHAT_CLOSED'),
    Match.when('appStartedFirstTime', () => 'FE_APP_STARTED_FIRST_TIME'),
    Match.when('loginFinished', () => 'FE_LOGIN_FINISHED'),
    Match.when('offerCreated', () => 'FE_OFFER_CREATED'),
    Match.exhaustive
  )
}

export function timestampWithFrontendEventJitter(now: Date): Date {
  const jitterMs = Math.floor(Math.random() * (MAX_TIMESTAMP_JITTER_MS + 1))
  return new Date(now.getTime() + jitterMs)
}

function metadataFromHeaders(
  headers: CommonHeaders
): Record<string, string | number | boolean> {
  return {
    clientVersion: Option.getOrElse(
      headers.clientVersionOrNone,
      () => 'UNKNOWN'
    ),
    clientSemver: Option.getOrElse(headers.clientSemverOrNone, () => 'UNKNOWN'),
    clientPlatform: Option.getOrElse(
      headers.clientPlatformOrNone,
      () => 'UNKNOWN'
    ),
    appSource: Option.getOrElse(headers.appSourceOrNone, () => 'UNKNOWN'),
    language: Option.getOrElse(headers.language, () => 'UNKNOWN'),
    isDeveloper: headers.isDeveloper,
  }
}

export function frontendEventToMetricRecord({
  headers,
  payload,
  now,
}: {
  headers: CommonHeaders
  payload: ReportFrontendEventRequest
  now: Date
}): InsertMetricsParams {
  return {
    name: frontendEventToMetricName(payload.event),
    timestamp: timestampWithFrontendEventJitter(now),
    type: metricTypeIncrement,
    uuid: generateUuid(),
    analyticsUuid: payload.analyticsUuid,
    value: 1,
    attributes: metadataFromHeaders(headers),
  }
}

export const reportFrontendEvent = HttpApiBuilder.handler(
  MetricsApiSpecification,
  'root',
  'reportFrontendEvent',
  ({headers, payload}) =>
    Effect.gen(function* (_) {
      const metricsDb = yield* _(MetricsDbService)
      yield* _(
        metricsDb.insertMetricRecord(
          frontendEventToMetricRecord({
            headers,
            payload,
            now: new Date(),
          })
        ),
        Effect.catchTag('MessageWithUuidAlreadyStoredError', () =>
          metricsDb.insertMetricRecord(
            frontendEventToMetricRecord({
              headers,
              payload,
              now: new Date(),
            })
          )
        ),
        Effect.catchTag('MessageWithUuidAlreadyStoredError', () =>
          Effect.zipRight(
            Effect.logWarning(
              'Generated duplicate frontend metric uuid twice. Not inserting.'
            ),
            Effect.void
          )
        )
      )

      return {}
    }).pipe(makeEndpointEffect)
)
