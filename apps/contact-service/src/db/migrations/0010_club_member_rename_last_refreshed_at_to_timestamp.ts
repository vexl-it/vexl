import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE club_member
    ALTER COLUMN last_refreshed_at
    SET DATA TYPE TIMESTAMPTZ USING to_timestamp(last_refreshed_at / 1000)::timestamptz,
    ALTER COLUMN last_refreshed_at
    SET NOT NULL;
  `
)
