import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'
import {NotificationTokens} from '../domain'

export const FindTokensOfUsersWhoDirectlyImportedHashParams = Schema.Struct({
  userHash: ServerHashedNumber,
  importedHashes: Schema.Array(ServerHashedNumber),
})
export type FindTokensOfUsersWhoDirectlyImportedHashParams =
  typeof FindTokensOfUsersWhoDirectlyImportedHashParams.Type

export const FindTokensOfUsersWhoDirectlyImportedHashResult = Schema.Struct({
  ...NotificationTokens.fields,
  clientVersion: Schema.NullOr(VersionCode),
})
export type FindTokensOfUsersWhoDirectlyImportedHashResult =
  typeof FindTokensOfUsersWhoDirectlyImportedHashResult.Type

export const createFindTokensOfUsersWhoDirectlyImportedHash = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: FindTokensOfUsersWhoDirectlyImportedHashParams,
      Result: FindTokensOfUsersWhoDirectlyImportedHashResult,
      execute: (params) => sql`
        SELECT DISTINCT
          u.firebase_token,
          u.expo_token,
          u.client_version
        FROM
          users u
          JOIN user_contact uc ON u.hash = uc.hash_from
        WHERE
          (
            u.firebase_token IS NOT NULL
            OR u.expo_token IS NOT NULL
          )
          AND uc.hash_to = ${params.userHash}
          AND ${sql.in('u.hash', params.importedHashes)}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findTokensOfUsersWhoDirectlyImportedHash',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('findTokensOfUsersWhoDirectlyImportedHash query')
    )
  }
)
