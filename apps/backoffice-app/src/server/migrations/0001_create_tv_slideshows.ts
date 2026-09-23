import {PgClient} from '@effect/sql-pg'
import {Effect} from 'effect'

export default Effect.flatMap(
  PgClient.PgClient,
  (sql) => sql`
    CREATE TABLE IF NOT EXISTS backoffice_tv_slideshows (
      uuid uuid PRIMARY KEY,
      public_token text NOT NULL UNIQUE,
      name text NOT NULL,
      slides jsonb NOT NULL DEFAULT '[]'::jsonb,
      is_enabled boolean NOT NULL DEFAULT TRUE,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS backoffice_tv_slideshows_public_token_idx ON backoffice_tv_slideshows (public_token);

    CREATE INDEX IF NOT EXISTS backoffice_tv_slideshows_updated_at_idx ON backoffice_tv_slideshows (updated_at DESC);
  `
)
