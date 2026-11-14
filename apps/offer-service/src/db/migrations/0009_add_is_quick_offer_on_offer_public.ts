import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE offer_public
    ADD COLUMN IF NOT EXISTS is_quick_offer BOOLEAN NOT NULL DEFAULT FALSE;
  `
)
