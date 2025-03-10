import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE club_member
    ALTER COLUMN last_refreshed_at TYPE TIMESTAMP WITH TIME ZONE USING to_timestamp(last_refreshed_at),
    ALTER COLUMN last_refreshed_at
    SET NOT NULL;
  `
)
