import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Effect, flow, Schema} from 'effect'

export const UpdateAppSourceForUserParams = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  hash: HashedPhoneNumberE,
  appSource: Schema.optionalWith(Schema.String, {as: 'Option'}),
})
export type UpdateAppSourceForUserParams =
  typeof UpdateAppSourceForUserParams.Type

export const createUpdateAppSourceForUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateAppSourceForUserParams,
    execute: (params) => sql`
      UPDATE users
      SET
        app_source = ${params.appSource ?? null}
      WHERE
        public_key = ${params.publicKey}
        AND hash = ${params.hash}
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error in updateAppSourceForUser', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateAppSourceForUser query')
  )
})
