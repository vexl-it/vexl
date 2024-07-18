import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE SEQUENCE IF NOT EXISTS feedback_submit_id_seq;

    ALTER TABLE public.feedback_submit
    ALTER COLUMN id
    SET DEFAULT nextval('feedback_submit_id_seq');

    SELECT
      setval(
        'feedback_submit_id_seq',
        (
          SELECT
            COALESCE(MAX(id), 1)
          FROM
            public.feedback_submit
        )
      )
  `
)
