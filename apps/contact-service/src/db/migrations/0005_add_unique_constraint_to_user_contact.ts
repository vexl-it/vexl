import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(SqlClient.SqlClient, (sql) =>
  sql`
    WITH
      count_of_rows AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY
              hash_from,
              hash_to
            ORDER BY
              id
          ) AS rn
        FROM
          user_contact
      )
    DELETE FROM user_contact
    WHERE
      id IN (
        SELECT
          id
        FROM
          count_of_rows
        WHERE
          rn >= 2
      );
  `.pipe(
    Effect.flatMap(
      () => sql`
        ALTER TABLE user_contact
        ADD CONSTRAINT unique_hash_combination UNIQUE (hash_from, hash_to);
      `
    )
  )
)
