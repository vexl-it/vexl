import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export const deduplicateExpoNotificationTokens = Effect.gen(function* (_) {
  const sql = yield* _(SqlClient.SqlClient)

  yield* _(sql`
    WITH
      ranked_notification_token_secrets AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY
              expo_notification_token
            ORDER BY
              updated_at DESC,
              id DESC
          ) AS duplicate_rank
        FROM
          notification_token_secrets
        WHERE
          expo_notification_token IS NOT NULL
      )
    UPDATE notification_token_secrets nts
    SET
      expo_notification_token = NULL
    FROM
      ranked_notification_token_secrets ranked
    WHERE
      nts.id = ranked.id
      AND ranked.duplicate_rank > 1
  `)

  yield* _(sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_secrets_expo_token_unique ON notification_token_secrets (expo_notification_token)
    WHERE
      expo_notification_token IS NOT NULL
  `)
})
