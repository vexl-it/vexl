import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE users
    DROP COLUMN IF EXISTS expo_token,
    DROP COLUMN IF EXISTS firebase_token;

    ALTER TABLE club_member
    DROP COLUMN IF EXISTS notification_token;
  `
)
