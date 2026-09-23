import {PgClient} from '@effect/sql-pg'
import {Effect} from 'effect'

export default Effect.flatMap(
  PgClient.PgClient,
  (sql) => sql`
    CREATE TABLE IF NOT EXISTS backoffice_short_links (
      slug text PRIMARY KEY,
      target_url text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS backoffice_short_link_clicks (
      slug text NOT NULL REFERENCES backoffice_short_links (slug) ON DELETE CASCADE,
      DAY date NOT NULL,
      count integer NOT NULL DEFAULT 0,
      PRIMARY KEY (slug, DAY)
    );
  `
)
