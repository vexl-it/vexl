import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(SqlClient.SqlClient, (sql) =>
  Effect.all([
    sql`
      CREATE INDEX IF NOT EXISTS idx_users_public_key_v2 ON users (public_key_v2)
      WHERE
        public_key_v2 IS NOT NULL
    `,
    sql`
      CREATE INDEX IF NOT EXISTS idx_club_member_public_key_v2_club_id ON club_member (public_key_v2, club_id)
      WHERE
        public_key_v2 IS NOT NULL
    `,
  ])
)
