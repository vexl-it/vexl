import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

export const addClientPrefix = Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE notification_token_secrets
    ADD COLUMN IF NOT EXISTS client_prefix INTEGER;
  `
)
