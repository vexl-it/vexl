import {HttpApiBuilder} from '@effect/platform/index'
import {type CommonHeaders} from '@vexl-next/rest-api/src/commonHeaders'
import {
  type FrontendEvent,
  type ReportFrontendEventRequest,
} from '@vexl-next/rest-api/src/services/metrics/contracts'
import {MetricsApiSpecification} from '@vexl-next/rest-api/src/services/metrics/specification'
import {makeEndpointEffect} from '@vexl-next/server-utils/src/makeEndpointEffect'
import {Effect, Option} from 'effect/index'
import {MetricsDbService} from '../db/MetricsDbService'
import {type InsertMetricsParams} from '../db/MetricsDbService/queries/createInsertMetricRecord'

const metricTypeIncrement = 'Increment'
const frontendEventMetricNames: Record<FrontendEvent, string> = {
  appOpened: 'FE_APP_OPENED',
  sessionStarted: 'FE_SESSION_STARTED',
  marketplaceOpened: 'FE_MARKETPLACE_OPENED',
  offerSearchPerformed: 'FE_OFFER_SEARCH_PERFORMED',
  noOffersFound: 'FE_NO_OFFERS_FOUND',
  offerViewed: 'FE_OFFER_VIEWED',
  offerCreateStarted: 'FE_OFFER_CREATE_STARTED',
  offerPaused: 'FE_OFFER_PAUSED',
  offerResumed: 'FE_OFFER_RESUMED',
  offerDeleted: 'FE_OFFER_DELETED',
  chatCreated: 'FE_CHAT_CREATED',
  chatOpened: 'FE_CHAT_OPENED',
  offerRequested: 'FE_OFFER_REQUESTED',
  offerRequestDenied: 'FE_OFFER_REQUEST_DENIED',
  offerRequestAccepted: 'FE_OFFER_REQUEST_ACCEPTED',
  offerRerequested: 'FE_OFFER_REREQUESTED',
  offerRequestAcceptedByOtherSide: 'FE_OFFER_REQUEST_ACCEPTED_BY_OTHER_SIDE',
  chatClosed: 'FE_CHAT_CLOSED',
  appStartedFirstTime: 'FE_APP_STARTED_FIRST_TIME',
  loginFinished: 'FE_LOGIN_FINISHED',
  offerCreated: 'FE_OFFER_CREATED',
}

export function frontendEventToMetricName(event: FrontendEvent): string {
  return frontendEventMetricNames[event]
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

function metadataFromPayloadAndHeaders({
  headers,
  payload,
}: {
  headers: CommonHeaders
  payload: ReportFrontendEventRequest
}): Record<string, string | number | boolean> {
  return {
    ...(payload.attributes ?? {}),
    ...metadataFromHeaders(headers),
  }
}

export function frontendEventToMetricRecord({
  headers,
  payload,
}: {
  headers: CommonHeaders
  payload: ReportFrontendEventRequest
}): InsertMetricsParams {
  return {
    name: frontendEventToMetricName(payload.event),
    timestamp: payload.date,
    type: metricTypeIncrement,
    uuid: payload.id,
    analyticsUuid: payload.analyticsId,
    value: 1,
    attributes: metadataFromPayloadAndHeaders({headers, payload}),
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
          })
        ),
        Effect.catchTag('MessageWithUuidAlreadyStoredError', () =>
          Effect.zipRight(
            Effect.logWarning(
              'Frontend metric with this uuid was already stored. Not inserting.'
            ),
            Effect.void
          )
        )
      )

      return {}
    }).pipe(makeEndpointEffect)
)
