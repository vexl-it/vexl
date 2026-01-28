import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashParams =
  Schema.Struct({
    userHash: ServerHashedNumber,
    importedHashes: Schema.Array(ServerHashedNumber),
  })
export type FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashParams =
  typeof FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashParams.Type

export const FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashResult =
  Schema.Struct({
    vexlNotificationToken: Schema.NullOr(VexlNotificationToken),
  })
export type FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashResult =
  typeof FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashResult.Type

export const createFindVexlNotificationTokensOfUsersWhoDirectlyImportedHash =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashParams,
      Result: FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashResult,
      execute: (params) => sql`
        SELECT DISTINCT
          u.vexl_notification_token
        FROM
          users u
          JOIN user_contact uc ON u.hash = uc.hash_from
        WHERE
          (u.vexl_notification_token IS NOT NULL)
          AND uc.hash_to = ${params.userHash}
          AND ${sql.in('u.hash', params.importedHashes)}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findVexlNotificationTokensOfUsersWhoDirectlyImportedHash',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan(
        'findVexlNotificationTokensOfUsersWhoDirectlyImportedHash query'
      )
    )
  })
