import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

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
