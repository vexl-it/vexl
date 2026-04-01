import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE SEQUENCE offer_public_part_version_seq AS bigint;

    ALTER TABLE offer_public
    ADD COLUMN public_part_version bigint NOT NULL DEFAULT 0;

    ALTER TABLE offer_public
    ALTER COLUMN public_part_version
    SET DEFAULT nextval('offer_public_part_version_seq');

    CREATE INDEX "offer_public_public_part_version_ix" ON offer_public (public_part_version);
  `
)
