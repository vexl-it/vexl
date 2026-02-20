import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS public_key_v2 varchar;
  `
)
