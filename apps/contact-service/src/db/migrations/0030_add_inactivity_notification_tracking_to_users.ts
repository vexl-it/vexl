import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE users
    ADD COLUMN last_inactivity_notification_sent_at timestamptz,
    ADD COLUMN number_of_inactivity_notifications_sent integer DEFAULT 0 NOT NULL;
  `
)
