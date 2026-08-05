import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    UPDATE message
    SET
      received_by_server_at = now()
    WHERE
      received_by_server_at IS NULL;

    ALTER TABLE message
    ALTER COLUMN received_by_server_at
    SET NOT NULL;
  `
)
