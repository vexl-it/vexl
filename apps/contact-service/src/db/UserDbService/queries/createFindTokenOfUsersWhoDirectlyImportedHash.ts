import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
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
  vexlNotificationToken: Schema.OptionFromOptionalNullOr(
    VexlNotificationToken
  ).pipe(Schema.withConstructorDefault(Effect.succeed(Option.none()))),
  clientVersion: Schema.NullOr(VersionCode),
})
export type FindTokensOfUsersWhoDirectlyImportedHashResult =
  typeof FindTokensOfUsersWhoDirectlyImportedHashResult.Type

export const createFindTokensOfUsersWhoDirectlyImportedHash = Effect.gen(
  function* () {
    const sql = yield* PgClient.PgClient

    const query = SqlSchema.findAll({
      Request: FindTokensOfUsersWhoDirectlyImportedHashParams,
      Result: FindTokensOfUsersWhoDirectlyImportedHashResult,
      execute: (params) => sql`
        SELECT DISTINCT
          u.firebase_token,
          u.expo_token,
          u.vexl_notification_token,
          u.client_version
        FROM
          users u
          JOIN user_contact uc ON u.hash = uc.hash_from
        WHERE
          (
            u.firebase_token IS NOT NULL
            OR u.expo_token IS NOT NULL
            OR u.vexl_notification_token IS NOT NULL
          )
          AND uc.hash_to = ${params.userHash}
          AND ${sql.in('u.hash', params.importedHashes)}
      `,
    })

    return flow(
      query,
      UnexpectedServerError.wrapErrors(
        'Error in findTokensOfUsersWhoDirectlyImportedHash'
      ),
      Effect.withSpan('findTokensOfUsersWhoDirectlyImportedHash query')
    )
  }
)
