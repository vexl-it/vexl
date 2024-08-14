import {Schema} from '@effect/schema'
import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, flow} from 'effect'

export const UpdateRefreshUserParams = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  hash: HashedPhoneNumberE,
  clientVersion: Schema.optionalWith(VersionCode, {as: 'Option'}),
  refreshedAt: Schema.Date,
})
export type UpdateRefreshUserParams = Schema.Schema.Type<
  typeof UpdateRefreshUserParams
>

export const createUpdateRefreshUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateRefreshUserParams,
    execute: (params) => sql`
      UPDATE users
      SET
        client_version = ${params.clientVersion ?? `client_version`},
        refreshed_at = ${params.refreshedAt}
      WHERE
        public_key = ${params.publicKey}
        AND hash = ${params.hash}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateRefreshUser', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateRefreshUser query')
  )
})
