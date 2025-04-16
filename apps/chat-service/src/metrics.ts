// TODO

import {SqlClient, SqlSchema} from '@effect/sql'
import {generateUuid} from '@vexl-next/domain/src/utility/Uuid.brand'
import {shouldDisableMetrics} from '@vexl-next/server-utils/src/commonConfigs'
import {MetricsMessage} from '@vexl-next/server-utils/src/metrics/domain'
import {type MetricsClientService} from '@vexl-next/server-utils/src/metrics/MetricsClientService'
import {reportMetricForked} from '@vexl-next/server-utils/src/metrics/reportMetricForked'
import {Effect, flow, Layer, Option, Schema} from 'effect'

const MESSAGE_SENT = 'MESSAGE_SENT'
const MESSAGE_FETCHED_AND_REMOVED = 'MESSAGE_FETCHED_AND_REMOVED'
const MESSAGE_EXPIRED = 'MESSAGE_EXPIRED'
const TOTAL_INBOXES_WITH_UNREAD_MESSAGES = 'TOTAL_INBOXES_WITH_UNREAD_MESSAGES'
const TOTAL_INBOXES = 'TOTAL_INBOXES'

const REQUEST_SENT = 'REQUEST_SENT'
const REQUEST_CANCEL = 'REQUEST_CANCELED'
const REQUEST_APPROVED = 'REQUEST_APPROVED'
const REQUEST_REJECTED = 'REQUEST_REJECTED'
const CHAT_CLOSED = 'CHAT_CLOSED'

export const reportRequestSent = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: REQUEST_SENT,
    })
  )

export const reportRequestCanceled = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: REQUEST_CANCEL,
    })
  )

export const reportRequestApproved = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: REQUEST_APPROVED,
    })
  )

export const reportRequestRejected = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: REQUEST_REJECTED,
    })
  )

export const reportChatClosed = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: CHAT_CLOSED,
    })
  )

export const reportMessageSent = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: MESSAGE_SENT,
    })
  )

export const reportMessageFetchedAndRemoved = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      value: number,
      uuid: generateUuid(),
      timestamp: new Date(),
      name: MESSAGE_FETCHED_AND_REMOVED,
    })
  )

export const reportMessageExpired = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: MESSAGE_EXPIRED,
    })
  )

const reportInboxesWithUnreadMessages = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: TOTAL_INBOXES_WITH_UNREAD_MESSAGES,
    })
  )

const reportTotalInboxes = (
  number: number
): Effect.Effect<void, never, MetricsClientService> =>
  reportMetricForked(
    new MetricsMessage({
      uuid: generateUuid(),
      value: number,
      timestamp: new Date(),
      name: TOTAL_INBOXES,
    })
  )

export const reportMetricsLayer = Layer.effectDiscard(
  Effect.gen(function* (_) {
    if (yield* _(shouldDisableMetrics)) {
      return
    }
    const sql = yield* _(SqlClient.SqlClient)

    const queryTotalInboxes = SqlSchema.findOne({
      Request: Schema.Null,
      Result: Schema.Struct({count: Schema.NumberFromString}),
      execute: () => sql`
        SELECT
          count(*) AS COUNT
        FROM
          inbox
      `,
    })(null).pipe(
      Effect.map(
        flow(
          Option.map((r) => r.count),
          Option.getOrElse(() => 0)
        )
      ),
      Effect.flatMap(reportTotalInboxes)
    )

    const queryUnreadInboxes = SqlSchema.findOne({
      Request: Schema.Null,
      Result: Schema.Struct({count: Schema.NumberFromString}),
      execute: () => sql`
        SELECT
          count(*) AS COUNT
        FROM
          (
            SELECT
              inbox.id,
              count(*)
            FROM
              inbox
              INNER JOIN public.message m ON inbox.id = m.inbox_id
            GROUP BY
              inbox.id
          ) AS a
      `,
    })(null).pipe(
      Effect.map(
        flow(
          Option.map((r) => r.count),
          Option.getOrElse(() => 0)
        )
      ),
      Effect.flatMap(reportInboxesWithUnreadMessages)
    )

    yield* _(
      Effect.zip(
        Effect.logInfo('Reporting metrics'),
        Effect.all([queryTotalInboxes, queryUnreadInboxes])
      ),
      Effect.tapError((e) => Effect.logError(`Error reporting metrics`, e)),
      Effect.tap(() => Effect.logInfo('Metrics reported')),
      Effect.ignore,
      Effect.flatMap(() => Effect.sleep(60_000)),
      Effect.forever,
      Effect.withSpan('Report metrics'),
      Effect.fork
    )
  })
)
