import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    DROP INDEX IF EXISTS "7b3205d35731428c8ff0_ix";

    DROP INDEX IF EXISTS "6d6d93381c6f4dc58dc1_ix";
  `
)
