import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

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
