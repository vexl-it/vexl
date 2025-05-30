import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS expo_token text;

    CREATE INDEX idx_users_expo_token ON users (expo_token);
  `
)
