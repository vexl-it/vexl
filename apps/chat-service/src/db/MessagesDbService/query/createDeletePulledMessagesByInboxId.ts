import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Option, Schema} from 'effect'
import {InboxRecordId} from '../../InboxDbService/domain'

export interface DeletedPulledMessagesSummary {
  count: number
  avgMessageAgeSeconds: Option.Option<number>
}

export const createDeletePulledMessagesMessagesByInboxId = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findOne({
      Result: Schema.Struct({
        count: Schema.NumberFromString,
        avgAgeSeconds: Schema.NullOr(Schema.Number),
      }),
      Request: InboxRecordId,
      execute: (params) => sql`
        WITH
          deleted AS (
            DELETE FROM message
            WHERE
              inbox_id = ${params}
              AND pulled = TRUE
            RETURNING
              received_by_server_at
          )
        SELECT
          count(*) AS COUNT,
          round(
            avg(
              EXTRACT(
                EPOCH
                FROM
                  now() - received_by_server_at
              )
            )
          )::int AS "avgAgeSeconds"
        FROM
          deleted
      `,
    })

    return flow(
      query,
      Effect.map(
        flow(
          Option.map(
            (r): DeletedPulledMessagesSummary => ({
              count: r.count,
              avgMessageAgeSeconds: Option.fromNullable(r.avgAgeSeconds),
            })
          ),
          Option.getOrElse(
            (): DeletedPulledMessagesSummary => ({
              count: 0,
              avgMessageAgeSeconds: Option.none(),
            })
          )
        )
      ),
      UnexpectedServerError.wrapErrors(
        'Error in deletePulledMessagesByInboxId'
      ),
      Effect.withSpan('deletePulledMessagesByInboxId find')
    )
  }
)
