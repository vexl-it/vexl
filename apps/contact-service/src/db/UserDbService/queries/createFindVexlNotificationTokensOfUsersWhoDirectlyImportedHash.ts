import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Effect, flow, Schema} from 'effect'
import {createIsNotOwnerAccountFragment} from '../../utils/createIsNotOwnerAccountFragment'

export const FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashParams =
  Schema.Struct({
    userHash: ServerHashedNumber,
    importedHashes: Schema.Array(ServerHashedNumber),
  })
export type FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashParams =
  typeof FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashParams.Type

export const FindVexlNotificationTokensOfUsersWhoDirectlyImportedHashResult =
  Schema.Struct({
    vexlNotificationToken: VexlNotificationToken,
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
          account_token_holder.vexl_notification_token
        FROM
          users u
          JOIN user_contact uc ON u.hash = uc.hash_from
          JOIN users account_token_holder ON account_token_holder.public_key = u.public_key
        WHERE
          (
            account_token_holder.vexl_notification_token IS NOT NULL
          )
          AND uc.hash_to = ${params.userHash}
          AND ${sql.in('u.hash', params.importedHashes)}
          AND ${createIsNotOwnerAccountFragment({
          usersTable: sql`u`,
          ownerHash: params.userHash,
          sql,
        })}
      `,
    })

    return flow(
      query,
      UnexpectedServerError.wrapErrors(
        'Error in findVexlNotificationTokensOfUsersWhoDirectlyImportedHash'
      ),
      Effect.withSpan(
        'findVexlNotificationTokensOfUsersWhoDirectlyImportedHash query'
      )
    )
  })
