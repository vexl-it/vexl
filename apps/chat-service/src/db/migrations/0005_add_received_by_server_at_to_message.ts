import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE message
    ADD COLUMN received_by_server_at TIMESTAMP WITH TIME ZONE;

    ALTER TABLE message
    ALTER COLUMN received_by_server_at
    SET DEFAULT clock_timestamp();
  `
)
