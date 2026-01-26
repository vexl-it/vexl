import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export const addClientPrefix = Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE notification_token_secrets
    ADD COLUMN IF NOT EXISTS client_prefix INTEGER;
  `
)
