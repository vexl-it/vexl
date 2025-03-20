import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {PlatformName} from '@vexl-next/rest-api'
import {Effect, flow, Schema} from 'effect'
import {NotificationTokens} from '../../UserDbService/domain'

const FindNotificationTokensByFiltersArgs = Schema.Struct({
  versionFromIncluded: Schema.NullOr(Schema.NumberFromString),
  versionToIncluded: Schema.NullOr(Schema.NumberFromString),
  platform: Schema.Array(PlatformName),
})
export type FindNotificationTokensByFiltersArgs =
  typeof FindNotificationTokensByFiltersArgs.Type

const FindNotificationTokensByFiltersResult = NotificationTokens
export type FindNotificationTokensByFiltersResult =
  typeof FindNotificationTokensByFiltersResult.Type

export const createFindNotificationTokensByFilter = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: FindNotificationTokensByFiltersArgs,
    Result: FindNotificationTokensByFiltersResult,
    execute: (params) => sql`
      SELECT
        firebase_token,
        expo_token
      FROM
        users
      WHERE
        (
          (
            ${params.versionFromIncluded}::int IS NULL
            OR (
              client_version >= ${params.versionFromIncluded}
              AND client_version IS NOT NULL
            )
          )
          AND (
            ${params.versionToIncluded}::int IS NULL
            OR (
              client_version <= ${params.versionToIncluded}
              AND client_version IS NOT NULL
            )
          )
        )
        AND ${sql.in('platform', params.platform)}
        AND (
          firebase_token IS NOT NULL
          OR expo_token IS NOT NULL
        )
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in findNotificationTokenByFilter', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('findNotificationTokenByFilter query')
  )
})
