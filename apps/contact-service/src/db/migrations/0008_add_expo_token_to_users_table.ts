import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS expo_token text;

    CREATE INDEX idx_users_expo_token ON users (expo_token);
  `
)
