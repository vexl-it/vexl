import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {
  AnalyticsKind,
  AnalyticsStateId,
  DayString,
} from '@vexl-next/analytics-definitions/src/core'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Array, Effect, flow, Option, Schema} from 'effect'
import {AnalyticsStateConflictError} from '../domain'

export const UpsertAnalyticsStateParams = Schema.Struct({
  id: AnalyticsStateId,
  kind: AnalyticsKind,
  name: Schema.String,
  schemaVersion: Schema.Int,
  revision: Schema.Int,
  startDay: DayString,
  updatedDay: DayString,
  payload: Schema.Object,
  appPlatform: Schema.String,
  appMajorVersion: Schema.String,
  countryPrefix: Schema.String,
})
export type UpsertAnalyticsStateParams = typeof UpsertAnalyticsStateParams.Type

const StoredKindAndName = Schema.Struct({
  kind: AnalyticsKind,
  name: Schema.String,
})

export const createUpsertAnalyticsState = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const upsert = flow(
    SqlSchema.findAll({
      Request: UpsertAnalyticsStateParams,
      Result: Schema.Struct({pk: Schema.BigInt}),
      execute: (params) => sql`
        INSERT INTO
          analytics_states (
            id,
            kind,
            name,
            schema_version,
            revision,
            start_day,
            updated_day,
            payload,
            app_platform,
            app_major_version,
            country_prefix
          )
        VALUES
          (
            ${params.id},
            ${params.kind},
            ${params.name},
            ${params.schemaVersion},
            ${params.revision},
            ${params.startDay},
            ${params.updatedDay},
            ${sql.json(params.payload)}::jsonb,
            ${params.appPlatform},
            ${params.appMajorVersion},
            ${params.countryPrefix}
          )
        ON CONFLICT (id)
        WHERE
          id IS NOT NULL DO UPDATE
        SET
          payload = EXCLUDED.payload,
          revision = EXCLUDED.revision,
          updated_day = EXCLUDED.updated_day,
          schema_version = EXCLUDED.schema_version,
          app_platform = EXCLUDED.app_platform,
          app_major_version = EXCLUDED.app_major_version,
          country_prefix = EXCLUDED.country_prefix
        WHERE
          EXCLUDED.revision >= analytics_states.revision
          AND analytics_states.kind = EXCLUDED.kind
          AND analytics_states.name = EXCLUDED.name
        RETURNING
          pk
      `,
    }),
    UnexpectedServerError.wrapErrors('Error in upsertAnalyticsState')
  )

  const findStoredKindAndName = flow(
    SqlSchema.findOne({
      Request: AnalyticsStateId,
      Result: StoredKindAndName,
      execute: (id) => sql`
        SELECT
          kind,
          name
        FROM
          analytics_states
        WHERE
          id = ${id}
      `,
    }),
    UnexpectedServerError.wrapErrors('Error in findStoredKindAndName')
  )

  const failOnKindOrNameMismatch = (
    params: UpsertAnalyticsStateParams
  ): Effect.Effect<void, AnalyticsStateConflictError | UnexpectedServerError> =>
    findStoredKindAndName(params.id).pipe(
      Effect.flatMap(
        Option.match({
          onNone: () => Effect.void,
          onSome: (stored) =>
            stored.kind === params.kind && stored.name === params.name
              ? Effect.void
              : Effect.fail(
                  new AnalyticsStateConflictError({name: params.name})
                ),
        })
      )
    )

  return (params: UpsertAnalyticsStateParams) =>
    upsert(params).pipe(
      Effect.flatMap((updatedRows) =>
        Array.isNonEmptyReadonlyArray(updatedRows)
          ? Effect.void
          : failOnKindOrNameMismatch(params)
      ),
      Effect.withSpan('upsertAnalyticsState query')
    )
})
