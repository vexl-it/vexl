import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Array, Effect, flow} from 'effect'

export const FindTokensOfUsersWhoDirectlyImportedHashParams = Schema.Struct({
  userHash: HashedPhoneNumberE,
  importedHashes: Schema.Array(HashedPhoneNumberE),
})
export type FindTokensOfUsersWhoDirectlyImportedHashParams = Schema.Schema.Type<
  typeof FindTokensOfUsersWhoDirectlyImportedHashParams
>

export const createFindTokensOfUsersWhoDirectlyImportedHash = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)

    const query = SqlSchema.findAll({
      Request: FindTokensOfUsersWhoDirectlyImportedHashParams,
      Result: Schema.Struct({firebaseToken: FcmTokenE}),
      execute: (params) => sql`
        SELECT DISTINCT
          u.firebase_token
        FROM
          users u
          JOIN user_contact uc ON u.hash = uc.hash_from
        WHERE
          u.firebase_token IS NOT NULL
          AND uc.hash_to = ${params.userHash}
          AND ${sql.in('u.hash', params.importedHashes)}
      `,
    })

    return flow(
      query,
      Effect.map(Array.map((a) => a.firebaseToken)),
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
