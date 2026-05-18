import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    ALTER TABLE metrics
    ADD COLUMN analytics_uuid UUID;

    CREATE INDEX idx_metrics_analytics_uuid_timestamp ON metrics (analytics_uuid, "timestamp");
  `
)
