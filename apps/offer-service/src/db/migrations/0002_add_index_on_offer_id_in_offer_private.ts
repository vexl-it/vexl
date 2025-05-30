import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql` CREATE INDEX "offer_id_ix" ON offer_private (offer_id);`
)
