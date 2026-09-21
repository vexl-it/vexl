import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE message
    ALTER COLUMN expires_at TYPE TIMESTAMP WITH TIME ZONE;

    CREATE INDEX message_expires_at_ix ON message (expires_at);
  `
)
