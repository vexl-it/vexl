import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

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
