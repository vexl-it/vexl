import {SqlClient, SqlError} from '@effect/sql'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Array, Effect, Schema} from 'effect'

export default Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  const hashesToRemove = yield* _(
    sql`
      SELECT
        old_v.hash AS hashes_to_remove
      FROM
        users old_v
        INNER JOIN users new_v ON new_v.hash = concat('next:', old_v.hash)
    `,
    Effect.flatMap(
      Schema.decodeUnknown(
        Schema.Array(Schema.Struct({hashesToRemove: HashedPhoneNumber}))
      )
    ),
    Effect.map(Array.map((one) => one.hashesToRemove)),
    Effect.catchTag('ParseError', () =>
      Effect.fail(
        new SqlError.SqlError({
          cause: 'Failed to parse result form db. Expected array of hashes',
        })
      )
    )
  )

  // Delete contacts
  yield* _(sql`
    DELETE FROM user_contact
    WHERE
      ${sql.in('hash_from', hashesToRemove)}
  `)

  // delete users
  yield* _(sql`
    DELETE FROM users
    WHERE
      ${sql.in('hash', hashesToRemove)}
  `)

  // remove next prefix from hash:
  yield* _(sql`
    UPDATE users
    SET
      hash = replace(hash, 'next:', '')
  `)

  // remove next prefix from user_contact
  yield* _(sql`
    UPDATE user_contact
    SET
      hash_from = replace(hash_from, 'next:', '');
  `)
})
