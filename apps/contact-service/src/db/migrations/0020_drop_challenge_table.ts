import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql` DROP TABLE IF EXISTS challenge; `
)
