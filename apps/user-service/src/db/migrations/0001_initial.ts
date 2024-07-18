import {SqlClient} from '@effect/sql'
import {Effect} from 'effect'

export default Effect.flatMap(
  SqlClient.SqlClient,
  (sql) => sql`
    CREATE TABLE public.feedback_submit (
      id bigint PRIMARY KEY NOT NULL,
      type character varying,
      last_update date NOT NULL,
      stars integer,
      objections character varying,
      text_comment character varying,
      form_id character varying,
      country_code character varying
    );

    CREATE UNIQUE index "form_id_IX" ON feedback_submit USING btree (form_id);

    CREATE TABLE public.user_verification (
      id bigint PRIMARY KEY NOT NULL,
      verification_code character varying,
      phone_number character varying,
      public_key character varying,
      expiration_at TIMESTAMP WITH TIME ZONE,
      challenge character varying,
      phone_verified boolean DEFAULT FALSE,
      user_id bigint,
      verification_sid character varying,
      country_prefix integer
    );

    CREATE INDEX "6d6d93381c6f4dc58dc1_ix" ON user_verification USING btree (public_key);

    CREATE INDEX "7b3205d35731428c8ff0_ix" ON user_verification USING btree (verification_code);

    CREATE TABLE public.users (
      id bigint PRIMARY KEY NOT NULL,
      public_key character varying NOT NULL,
      country_prefix integer
    );

    CREATE UNIQUE index users_public_key_key ON users USING btree (public_key);

    CREATE INDEX "88c6403cdcd7415d9c8c_ix" ON users USING btree (public_key);
  `
)
