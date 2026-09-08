import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

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
