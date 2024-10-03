import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow} from 'effect'

export const createDeleteInboxByPublicKey = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: PublicKeyPemBase64E,
    execute: (params) => sql`
      DELETE FROM inbox
      WHERE
        public_key = ${params}
    `,
  })

  return () =>
    flow(
      query,
      Effect.catchAll((e) =>
        Effect.zipRight(
          Effect.logError('Error in deleteInboxByPublicKey', e),
          Effect.fail(new UnexpectedServerError({status: 500}))
        )
      ),
      Effect.withSpan('deleteInboxByPublicKey query')
    )
})
