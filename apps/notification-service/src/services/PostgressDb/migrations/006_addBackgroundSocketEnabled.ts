import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

export const addBackgroundSocketEnabled = Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE notification_token_secrets
    ADD COLUMN IF NOT EXISTS background_socket_enabled BOOLEAN NOT NULL DEFAULT FALSE;
  `
)
