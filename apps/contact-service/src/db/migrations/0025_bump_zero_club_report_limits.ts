import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    UPDATE club
    SET
      report_limit = 1
    WHERE
      report_limit <= 0;
  `
)
