import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export const addSystemAndMarketingVexlTokens = Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE notification_token_secrets
    ADD COLUMN IF NOT EXISTS system_vexl_token VARCHAR(255),
    ADD COLUMN IF NOT EXISTS marketing_vexl_token VARCHAR(255);

    CREATE INDEX IF NOT EXISTS idx_notification_secrets_system_vexl_token ON notification_token_secrets (system_vexl_token);

    CREATE INDEX IF NOT EXISTS idx_notification_secrets_marketing_vexl_token ON notification_token_secrets (marketing_vexl_token);
  `
)
