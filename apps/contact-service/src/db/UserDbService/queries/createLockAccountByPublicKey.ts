import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'

/**
 * Serializes account-wide mutations (`deleteAccount`, `restoreUser`) for the
 * same public key for the lifetime of the current DB transaction without
 * taking row locks on `users`, avoiding lock-order deadlocks with per-number
 * refreshes that clear notification tokens on other rows.
 */
export const createLockAccountByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: PublicKeyPemBase64,
    execute: (publicKey) => sql`
      SELECT
        pg_advisory_xact_lock(
          hashtextextended (
            ${`contact-account:${publicKey}`}::text,
            0::bigint
          )
        )
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in lockAccountByPublicKey'),
    Effect.withSpan('lockAccountByPublicKey query')
  )
})
