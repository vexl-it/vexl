import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE club
    ADD COLUMN report_limit integer DEFAULT 10 NOT NULL;
  `
)
