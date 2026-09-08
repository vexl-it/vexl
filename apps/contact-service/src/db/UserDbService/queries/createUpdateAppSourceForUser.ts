import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdateAppSourceForUserParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  appSource: Schema.OptionFromOptional(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type UpdateAppSourceForUserParams =
  typeof UpdateAppSourceForUserParams.Type

export const createUpdateAppSourceForUser = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

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
    UnexpectedServerError.wrapErrors('Error in updateAppSourceForUser'),
    Effect.withSpan('updateAppSourceForUser query')
  )
})
