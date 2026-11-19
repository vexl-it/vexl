import {PgClient} from '@effect/sql-pg'
import {Effect} from 'effect'

export default Effect.flatMap(
  PgClient.PgClient,
  (sql) => sql`
    CREATE TABLE IF NOT EXISTS backoffice_passkeys (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      label text NOT NULL,
      credential_id text NOT NULL UNIQUE,
      public_key bytea NOT NULL,
      counter bigint NOT NULL,
      transports jsonb NOT NULL,
      permissions jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_used_at timestamptz
    );

    CREATE TABLE IF NOT EXISTS backoffice_sessions (
      token_hash text PRIMARY KEY,
      passkey_id uuid NOT NULL REFERENCES backoffice_passkeys (id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS backoffice_invites (
      token_hash text PRIMARY KEY,
      label text NOT NULL,
      permissions jsonb NOT NULL,
      expires_at timestamptz NOT NULL
    );

    CREATE TABLE IF NOT EXISTS backoffice_webauthn_challenges (
      token_hash text PRIMARY KEY,
      challenge text NOT NULL,
      kind text NOT NULL,
      label text,
      invite_token_hash text,
      expires_at timestamptz NOT NULL
    );
  `
)
