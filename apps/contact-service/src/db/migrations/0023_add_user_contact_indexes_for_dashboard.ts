import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE INDEX IF NOT EXISTS idx_user_contact_hash_from_id_v2 ON user_contact (hash_from, id);

    CREATE INDEX IF NOT EXISTS idx_user_contact_hash_to_hash_from_v2 ON user_contact (hash_to, hash_from);
  `
)
