import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql` CREATE INDEX "offer_id_ix" ON offer_private (offer_id);`
)
