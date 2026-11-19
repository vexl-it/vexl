import {
  ALL_SECTIONS,
  BackofficeSection,
  type Passkey,
} from '@/src/services/access/domain'
import {PgClient} from '@effect/sql-pg'
import {type SqlError} from '@effect/sql/SqlError'
import {Array, Effect, Option, pipe, Schema} from 'effect'
import {isUniqueViolationError} from '../db'
import {accessError, type AccessRequestError} from './errors'
import {generateToken, hashToken} from './tokens'

type Db<A, E = never> = Effect.Effect<A, SqlError | E, PgClient.PgClient>

export const SESSION_LIFETIME_SECONDS = 12 * 60 * 60
const INVITE_LIFETIME_SECONDS = 5 * 60
export const CHALLENGE_LIFETIME_SECONDS = 5 * 60

// Arbitrary constant; only has to be unique within the backoffice database.
const ACCESS_ADVISORY_LOCK_KEY = 728_302

const ADMINS_JSON = JSON.stringify(['admins'])

export interface SignedInPasskey {
  readonly id: string
  readonly label: string
  readonly sections: readonly BackofficeSection[]
}

export interface Credential {
  readonly id: string
  readonly publicKey: Uint8Array
  readonly counter: number
  readonly transports: readonly string[]
}

export interface StoredCredential extends Credential {
  readonly passkeyId: string
}

export type ChallengePurpose =
  | {readonly kind: 'login'}
  | {readonly kind: 'setup'; readonly label: string}
  | {readonly kind: 'invite'; readonly inviteTokenHash: string}

const ChallengeRow = Schema.Union(
  Schema.Struct({challenge: Schema.String, kind: Schema.Literal('login')}),
  Schema.Struct({
    challenge: Schema.String,
    kind: Schema.Literal('setup'),
    label: Schema.String,
  }),
  Schema.Struct({
    challenge: Schema.String,
    kind: Schema.Literal('invite'),
    inviteTokenHash: Schema.String,
  })
)
export type StoredChallenge = typeof ChallengeRow.Type

interface PasskeyRow {
  readonly id: string
  readonly label: string
  readonly permissions: unknown
  readonly createdAt: Date
  readonly lastUsedAt: Date | null
}

interface CredentialRow {
  readonly id: string
  readonly publicKey: Uint8Array
  readonly counter: number
  readonly transports: unknown
}

const decodeUnknownArray = Schema.decodeUnknownOption(
  Schema.Array(Schema.Unknown)
)

// Lenient so a section removed from the code does not break stored rows.
const decodeEach = <A>(schema: Schema.Schema<A>) => {
  const decode = Schema.decodeUnknownOption(schema)
  return (raw: unknown): readonly A[] =>
    pipe(
      decodeUnknownArray(raw),
      Option.getOrElse((): readonly unknown[] => []),
      Array.filterMap((value) => decode(value))
    )
}

const toSections = decodeEach(BackofficeSection)
const toTransports = decodeEach(Schema.String)

const toSignedInPasskey = (row: PasskeyRow): SignedInPasskey => ({
  id: row.id,
  label: row.label,
  sections: toSections(row.permissions),
})

const toPasskey = (row: PasskeyRow): Passkey => ({
  ...toSignedInPasskey(row),
  createdAt: row.createdAt.toISOString(),
  lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
})

const withAccessLock = <A, E>(effect: Db<A, E>): Db<A, E> =>
  Effect.flatMap(PgClient.PgClient, (sql) =>
    sql.withTransaction(
      Effect.zipRight(
        sql`
          SELECT
            pg_advisory_xact_lock(${ACCESS_ADVISORY_LOCK_KEY})
        `,
        effect
      )
    )
  )

export const isSetupRequired: Db<boolean> = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const rows = yield* _(sql`
    SELECT
      1
    FROM
      backoffice_passkeys
    LIMIT
      1
  `)
  return !Array.isNonEmptyReadonlyArray(rows)
})

export const findSessionPasskey = (
  sessionToken: string
): Db<Option.Option<SignedInPasskey>> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<PasskeyRow>`
      SELECT
        p.id,
        p.label,
        p.permissions
      FROM
        backoffice_sessions s
        JOIN backoffice_passkeys p ON p.id = s.passkey_id
      WHERE
        s.token_hash = ${hashToken(sessionToken)}
        AND s.expires_at > now()
    `)
    return pipe(rows, Array.head, Option.map(toSignedInPasskey))
  })

/** Returns the raw session token for the cookie. */
export const createSession = (passkeyId: string): Db<string> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const token = generateToken()
    yield* _(sql`
      DELETE FROM backoffice_sessions
      WHERE
        expires_at <= now()
    `)
    yield* _(sql`
      INSERT INTO
        backoffice_sessions (token_hash, passkey_id, expires_at)
      VALUES
        (
          ${hashToken(token)},
          ${passkeyId},
          now() + make_interval(secs => ${SESSION_LIFETIME_SECONDS})
        )
    `)
    return token
  })

export const deleteSession = (sessionToken: string): Db<void> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    yield* _(sql`
      DELETE FROM backoffice_sessions
      WHERE
        token_hash = ${hashToken(sessionToken)}
    `)
  })

/** Returns the raw token that references the challenge from a cookie. */
export const saveChallenge = (
  challenge: string,
  purpose: ChallengePurpose
): Db<string> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const token = generateToken()
    yield* _(sql`
      DELETE FROM backoffice_webauthn_challenges
      WHERE
        expires_at <= now()
    `)
    yield* _(sql`
      INSERT INTO
        backoffice_webauthn_challenges (
          token_hash,
          challenge,
          kind,
          label,
          invite_token_hash,
          expires_at
        )
      VALUES
        (
          ${hashToken(token)},
          ${challenge},
          ${purpose.kind},
          ${purpose.kind === 'setup' ? purpose.label : null},
          ${purpose.kind === 'invite' ? purpose.inviteTokenHash : null},
          now() + make_interval(secs => ${CHALLENGE_LIFETIME_SECONDS})
        )
    `)
    return token
  })

export const consumeChallenge = (
  token: string
): Db<Option.Option<StoredChallenge>> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql`
      DELETE FROM backoffice_webauthn_challenges
      WHERE
        token_hash = ${hashToken(token)}
        AND expires_at > now()
      RETURNING
        challenge,
        kind,
        label,
        invite_token_hash
    `)
    return pipe(
      rows,
      Array.head,
      Option.flatMap(Schema.decodeUnknownOption(ChallengeRow))
    )
  })

export const findCredential = (
  credentialId: string
): Db<Option.Option<StoredCredential>> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<CredentialRow>`
      SELECT
        id,
        public_key,
        counter::float8 AS counter,
        transports
      FROM
        backoffice_passkeys
      WHERE
        credential_id = ${credentialId}
    `)
    return pipe(
      rows,
      Array.head,
      Option.map((row) => ({
        passkeyId: row.id,
        id: credentialId,
        publicKey: row.publicKey,
        counter: row.counter,
        transports: toTransports(row.transports),
      }))
    )
  })

export const recordPasskeyUse = (
  passkeyId: string,
  counter: number
): Db<Option.Option<SignedInPasskey>> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<PasskeyRow>`
      UPDATE backoffice_passkeys
      SET
        counter = ${counter},
        last_used_at = now()
      WHERE
        id = ${passkeyId}
      RETURNING
        id,
        label,
        permissions
    `)
    return pipe(rows, Array.head, Option.map(toSignedInPasskey))
  })

const insertPasskey = (
  credential: Credential,
  label: string,
  sections: readonly BackofficeSection[]
): Db<SignedInPasskey, AccessRequestError> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(
      sql<{readonly id: string}>`
        INSERT INTO
          backoffice_passkeys (
            label,
            credential_id,
            public_key,
            counter,
            transports,
            permissions
          )
        VALUES
          (
            ${label},
            ${credential.id},
            ${Buffer.from(credential.publicKey)},
            ${credential.counter},
            ${JSON.stringify(credential.transports)}::jsonb,
            ${JSON.stringify(sections)}::jsonb
          )
        RETURNING
          id
      `.pipe(
        Effect.catchIf(isUniqueViolationError, () =>
          accessError(409, 'This passkey is already registered')
        )
      )
    )
    const id = yield* _(Array.head(rows), Effect.orDie)
    return {id: id.id, label, sections}
  })

export const registerFirstPasskey = (
  credential: Credential,
  label: string
): Db<SignedInPasskey, AccessRequestError> =>
  withAccessLock(
    Effect.gen(function* (_) {
      if (!(yield* _(isSetupRequired))) {
        return yield* _(accessError(409, 'The first admin is already set up'))
      }
      return yield* _(insertPasskey(credential, label, ALL_SECTIONS))
    })
  )

export const registerInvitedPasskey = (
  credential: Credential,
  inviteTokenHash: string
): Db<SignedInPasskey, AccessRequestError> =>
  Effect.flatMap(PgClient.PgClient, (sql) =>
    sql.withTransaction(
      Effect.gen(function* (_) {
        const rows = yield* _(sql<{
          readonly label: string
          readonly permissions: unknown
        }>`
          DELETE FROM backoffice_invites
          WHERE
            token_hash = ${inviteTokenHash}
            AND expires_at > now()
          RETURNING
            label,
            permissions
        `)
        const invite = yield* _(
          Array.head(rows),
          Effect.mapError(() =>
            accessError(404, 'This invite was already used or has expired')
          )
        )
        return yield* _(
          insertPasskey(
            credential,
            invite.label,
            toSections(invite.permissions)
          )
        )
      })
    )
  )

export const findInviteLabel = (
  inviteTokenHash: string
): Db<Option.Option<string>> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql<{readonly label: string}>`
      SELECT
        label
      FROM
        backoffice_invites
      WHERE
        token_hash = ${inviteTokenHash}
        AND expires_at > now()
    `)
    return pipe(
      rows,
      Array.head,
      Option.map((row) => row.label)
    )
  })

export const createInvite = (
  label: string,
  sections: readonly BackofficeSection[]
): Db<{readonly token: string; readonly expiresAt: Date}> =>
  Effect.gen(function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const token = generateToken()
    yield* _(sql`
      DELETE FROM backoffice_invites
      WHERE
        expires_at <= now()
    `)
    const rows = yield* _(sql<{readonly expiresAt: Date}>`
      INSERT INTO
        backoffice_invites (token_hash, label, permissions, expires_at)
      VALUES
        (
          ${hashToken(token)},
          ${label},
          ${JSON.stringify(sections)}::jsonb,
          now() + make_interval(secs => ${INVITE_LIFETIME_SECONDS})
        )
      RETURNING
        expires_at
    `)
    const {expiresAt} = yield* _(Array.head(rows), Effect.orDie)
    return {token, expiresAt}
  })

export const listPasskeys: Db<readonly Passkey[]> = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)
  const rows = yield* _(sql<PasskeyRow>`
    SELECT
      id,
      label,
      permissions,
      created_at,
      last_used_at
    FROM
      backoffice_passkeys
    ORDER BY
      created_at
  `)
  return Array.map(rows, toPasskey)
})

const ensureAnAdminRemains: Db<void, AccessRequestError> = Effect.gen(
  function* (_) {
    const sql = yield* _(PgClient.PgClient)
    const rows = yield* _(sql`
      SELECT
        1
      FROM
        backoffice_passkeys
      WHERE
        permissions @> ${ADMINS_JSON}::jsonb
      LIMIT
        1
    `)
    if (!Array.isNonEmptyReadonlyArray(rows)) {
      return yield* _(
        accessError(409, 'At least one passkey has to keep the Admins section')
      )
    }
  }
)

const passkeyNotFound = (): AccessRequestError =>
  accessError(404, 'Passkey not found')

export const updatePasskeySections = (
  passkeyId: string,
  sections: readonly BackofficeSection[]
): Db<Passkey, AccessRequestError> =>
  withAccessLock(
    Effect.gen(function* (_) {
      const sql = yield* _(PgClient.PgClient)
      const rows = yield* _(sql<PasskeyRow>`
        UPDATE backoffice_passkeys
        SET
          permissions = ${JSON.stringify(sections)}::jsonb
        WHERE
          id = ${passkeyId}
        RETURNING
          id,
          label,
          permissions,
          created_at,
          last_used_at
      `)
      const row = yield* _(Array.head(rows), Effect.mapError(passkeyNotFound))
      yield* _(ensureAnAdminRemains)
      return toPasskey(row)
    })
  )

export const deletePasskey = (
  passkeyId: string
): Db<void, AccessRequestError> =>
  withAccessLock(
    Effect.gen(function* (_) {
      const sql = yield* _(PgClient.PgClient)
      const rows = yield* _(sql`
        DELETE FROM backoffice_passkeys
        WHERE
          id = ${passkeyId}
        RETURNING
          id
      `)
      if (!Array.isNonEmptyReadonlyArray(rows)) {
        return yield* _(passkeyNotFound())
      }
      yield* _(ensureAnAdminRemains)
    })
  )
