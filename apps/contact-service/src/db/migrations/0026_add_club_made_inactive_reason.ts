import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE club
    ADD COLUMN made_inactive_reason text DEFAULT NULL;

    UPDATE club
    SET
      made_inactive_reason = CASE
        WHEN valid_until < now() THEN 'EXPIRED'
        WHEN report >= report_limit THEN 'FLAGGED'
        ELSE 'UNKNOWN'
      END
    WHERE
      made_inactive_at IS NOT NULL;
  `
)
