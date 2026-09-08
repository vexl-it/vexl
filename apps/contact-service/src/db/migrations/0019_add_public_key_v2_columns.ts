import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

export default Effect.flatMap(SqlClient.SqlClient, (sql) =>
  Effect.all([
    sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS public_key_v2 text
    `,
    sql`
      ALTER TABLE club_member
      ADD COLUMN IF NOT EXISTS public_key_v2 text
    `,
  ])
)
