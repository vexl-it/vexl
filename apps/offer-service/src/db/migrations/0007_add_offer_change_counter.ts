import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE SEQUENCE offer_change_counter_seq;

    COMMENT ON SEQUENCE offer_change_counter_seq IS 'Shared by offer_public.update_counter and offer_private.update_counter; intentionally not OWNED BY a single column.';

    ALTER TABLE offer_public
    ADD COLUMN update_counter BIGINT;

    ALTER TABLE offer_private
    ADD COLUMN update_counter BIGINT;

    UPDATE offer_public
    SET
      update_counter = nextval('offer_change_counter_seq')
    WHERE
      update_counter IS NULL;

    UPDATE offer_private
    SET
      update_counter = nextval('offer_change_counter_seq')
    WHERE
      update_counter IS NULL;

    ALTER TABLE offer_public
    ALTER COLUMN update_counter
    SET NOT NULL;

    ALTER TABLE offer_private
    ALTER COLUMN update_counter
    SET NOT NULL;

    ALTER TABLE offer_public
    ALTER COLUMN update_counter
    SET DEFAULT nextval('offer_change_counter_seq');

    ALTER TABLE offer_private
    ALTER COLUMN update_counter
    SET DEFAULT nextval('offer_change_counter_seq');

    CREATE INDEX offer_public_update_counter_ix ON offer_public (update_counter);

    CREATE INDEX offer_private_user_public_key_update_counter_id_ix ON offer_private (user_public_key, update_counter, id);
  `
)
