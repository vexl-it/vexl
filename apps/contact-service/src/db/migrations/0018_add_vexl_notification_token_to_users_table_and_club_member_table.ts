import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS vexl_notification_token text;

    CREATE INDEX idx_users_vexl_notification_token ON users (vexl_notification_token);

    ALTER TABLE club_member
    ADD COLUMN IF NOT EXISTS vexl_notification_token text;

    CREATE INDEX idx_club_member_vexl_notification_token ON club_member (vexl_notification_token);
  `
)
