import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    UPDATE users
    SET
      expo_token = NULL
    WHERE
      id IN (
        SELECT
          id
        FROM
          (
            SELECT
              id,
              row_number() OVER (
                PARTITION BY
                  expo_token
                ORDER BY
                  refreshed_at DESC NULLS LAST,
                  id DESC
              ) AS rn
            FROM
              users
            WHERE
              expo_token IS NOT NULL
          ) ranked
        WHERE
          rn > 1
      );

    UPDATE users
    SET
      vexl_notification_token = NULL
    WHERE
      id IN (
        SELECT
          id
        FROM
          (
            SELECT
              id,
              row_number() OVER (
                PARTITION BY
                  vexl_notification_token
                ORDER BY
                  refreshed_at DESC NULLS LAST,
                  id DESC
              ) AS rn
            FROM
              users
            WHERE
              vexl_notification_token IS NOT NULL
          ) ranked
        WHERE
          rn > 1
      );

    CREATE UNIQUE INDEX users_expo_token_unique_ix ON users (expo_token);

    CREATE UNIQUE INDEX users_vexl_notification_token_unique_ix ON users (vexl_notification_token);
  `
)
