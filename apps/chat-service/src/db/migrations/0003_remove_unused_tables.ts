import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    DROP TABLE IF EXISTS stats;

    DROP TABLE IF EXISTS "group";

    DROP TABLE IF EXISTS databasechangelog;

    DROP TABLE IF EXISTS databasechangeloglock;
  `
)
