import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Array, Effect, flow} from 'effect'

export const createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactParams =
  Schema.Struct({
    importedHashes: Schema.Array(HashedPhoneNumberE),
    ownerHash: HashedPhoneNumberE,
  })
export type FindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactParams =
  Schema.Schema.Type<
    typeof createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactParams
  >

export const createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact =
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request:
        createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactParams,
      Result: Schema.Struct({firebaseToken: FcmTokenE}),
      execute: (params) => sql`
        SELECT DISTINCT
          (second_degree_friend.firebase_token) AS firebase_token
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
          AND second_degree_friend.firebase_token IS NOT NULL
          AND second_degree_friend.hash != ${params.ownerHash}
      `,
    })

    return flow(
      query,
      Effect.map(Array.map((a) => a.firebaseToken)),
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError(
            'Error in findFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact',
            e
          ),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan(
        'findFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact query'
      )
    )
  })
