import {PgClient} from '@effect/sql-pg'
import {Effect} from 'effect'

export default Effect.flatMap(
  PgClient.PgClient,
  (sql) => sql`
    ALTER TABLE backoffice_tv_slideshows
    ADD COLUMN IF NOT EXISTS public_slug text;

    CREATE UNIQUE INDEX IF NOT EXISTS backoffice_tv_slideshows_public_slug_idx ON backoffice_tv_slideshows (public_slug)
    WHERE
      public_slug IS NOT NULL;
  `
)
