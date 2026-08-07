import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(SqlClient.SqlClient, (sql) =>
  sql`
    DELETE FROM users
    WHERE
      id IN (
        SELECT
          id
        FROM
          (
            SELECT
              id,
              ROW_NUMBER() OVER (
                PARTITION BY
                  hash
                ORDER BY
                  refreshed_at DESC NULLS LAST,
                  id DESC
              ) AS rn
            FROM
              users
          ) ranked
        WHERE
          rn > 1
      );
  `.pipe(
    Effect.flatMap(
      () => sql` CREATE UNIQUE INDEX users_hash_unique_ix ON users (hash); `
    )
  )
)
