import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const createFindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContactParams =
  Schema.Struct({
    importedHashes: Schema.Array(ServerHashedNumber),
    ownerHash: ServerHashedNumber,
  })
export type FindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContactParams =
  typeof createFindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContactParams.Type

export const FindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContactResult =
  Schema.Struct({
    vexlNotificationToken: Schema.NullOr(VexlNotificationToken),
  })
export type FindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContactResult =
  typeof FindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContactResult.Type

export const createFindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContact =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request:
        createFindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContactParams,
      Result:
        FindVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContactResult,
      execute: (params) => sql`
        SELECT DISTINCT
          (second_degree_friend.vexl_notification_token) AS vexl_notification_token
        FROM
          user_contact connections_to_imported_contacts
          INNER JOIN users second_degree_friend ON second_degree_friend.hash = connections_to_imported_contacts.hash_from
        WHERE
          TRUE
          AND ${sql.in(
          'connections_to_imported_contacts.hash_to',
          params.importedHashes
        )}
          AND connections_to_imported_contacts.hash_to != connections_to_imported_contacts.hash_from
          AND (
            second_degree_friend.vexl_notification_token IS NOT NULL
          )
          AND second_degree_friend.hash != ${params.ownerHash}
      `,
    })

    return flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContact',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan(
        'findVexlNotificationTokensOfUsersWhoHaveHashAsSecondLevelContact query'
      )
    )
  })
