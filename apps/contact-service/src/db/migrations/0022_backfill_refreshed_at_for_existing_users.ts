import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    UPDATE users
    SET
      refreshed_at = CURRENT_DATE
    WHERE
      refreshed_at IS NULL
  `
)
