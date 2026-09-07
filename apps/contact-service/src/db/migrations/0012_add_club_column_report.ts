import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE club
    ADD COLUMN report integer DEFAULT 0 NOT NULL;
  `
)
