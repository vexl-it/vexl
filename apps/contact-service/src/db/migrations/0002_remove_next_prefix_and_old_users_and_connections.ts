import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, Effect, pipe, Schema} from 'effect'
import {SqlClient, SqlError} from 'effect/unstable/sql'

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  const hashesToRemove = yield* pipe(
    sql`
      SELECT
        old_v.hash AS hashes_to_remove
      FROM
        users old_v
        INNER JOIN users new_v ON new_v.hash = concat('next:', old_v.hash)
    `,
    Effect.flatMap(
      Schema.decodeUnknownEffect(
        Schema.Array(Schema.Struct({hashesToRemove: HashedPhoneNumber}))
      )
    ),
    Effect.map(Array.map((one) => one.hashesToRemove)),
    Effect.catchTag('SchemaError', () =>
      Effect.fail(
        new SqlError.SqlError({
          reason: new SqlError.UnknownError({
            cause: undefined,
            message: 'Failed to parse result from db. Expected array of hashes',
          }),
        })
      )
    )
  )

  // Delete contacts
  yield* sql`
    DELETE FROM user_contact
    WHERE
      ${sql.in('hash_from', hashesToRemove)}
  `

  // delete users
  yield* sql`
    DELETE FROM users
    WHERE
      ${sql.in('hash', hashesToRemove)}
  `

  // remove next prefix from hash:
  yield* sql`
    UPDATE users
    SET
      hash = replace(hash, 'next:', '')
  `

  // remove next prefix from user_contact
  yield* sql`
    UPDATE user_contact
    SET
      hash_from = replace(hash_from, 'next:', '');
  `
})
