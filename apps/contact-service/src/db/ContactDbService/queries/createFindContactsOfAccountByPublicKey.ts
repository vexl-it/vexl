import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {ServerHashedNumber} from '@vexl-next/domain/src/general/ServerHashedNumber'
import {Effect, flow, Schema} from 'effect'

export const FindContactsOfAccountByPublicKeyResult = Schema.Struct({
  hashFrom: ServerHashedNumber,
  hashTo: ServerHashedNumber,
})
export type FindContactsOfAccountByPublicKeyResult =
  typeof FindContactsOfAccountByPublicKeyResult.Type

export const createFindContactsOfAccountByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.findAll({
    Request: PublicKeyPemBase64,
    Result: FindContactsOfAccountByPublicKeyResult,
    execute: (publicKey) => sql`
      SELECT
        uc.hash_from,
        uc.hash_to
      FROM
        users u
        JOIN user_contact uc ON uc.hash_from = u.hash
      WHERE
        u.public_key = ${publicKey}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors(
      'Error in findContactsOfAccountByPublicKey'
    ),
    Effect.withSpan('findContactsOfAccountByPublicKey query')
  )
})
