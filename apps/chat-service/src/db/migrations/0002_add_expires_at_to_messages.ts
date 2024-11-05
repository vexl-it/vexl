import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE message
    ADD COLUMN expires_at DATE;

    UPDATE message
    SET
      expires_at = now() + interval '30 day';

    ALTER TABLE message
    ALTER COLUMN expires_at
    SET NOT NULL;
  `
)
