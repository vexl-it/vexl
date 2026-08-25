import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export const addBackgroundSocketEnabled = Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE notification_token_secrets
    ADD COLUMN IF NOT EXISTS background_socket_enabled BOOLEAN NOT NULL DEFAULT FALSE;
  `
)
