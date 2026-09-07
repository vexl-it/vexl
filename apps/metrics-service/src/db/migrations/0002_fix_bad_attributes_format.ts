import {Effect} from 'effect'
import {SqlClient} from 'effect/unstable/sql'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    UPDATE metrics
    SET
      attributes = (
        CASE
          WHEN attributes::jsonb IS NOT NULL THEN replace(
            SUBSTRING(attributes::text, 2, LENGTH(attributes::text) - 2),
            '\\"',
            '"'
          )
          ELSE NULL
        END
      )::jsonb
  `
)
