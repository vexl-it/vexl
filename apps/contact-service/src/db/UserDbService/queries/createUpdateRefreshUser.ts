import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, flow, Schema} from 'effect'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdateRefreshUserParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  clientVersion: Schema.optionalWith(VersionCode, {as: 'Option'}),
  countryPrefix: Schema.optionalWith(CountryPrefix, {as: 'Option'}),
  appSource: Schema.optionalWith(Schema.String, {as: 'Option'}),
  refreshedAt: Schema.Date,
})
export type UpdateRefreshUserParams = typeof UpdateRefreshUserParams.Type

export const createUpdateRefreshUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.void({
    Request: UpdateRefreshUserParams,
    execute: (params) => sql`
      UPDATE users
      SET
        client_version = ${params.clientVersion ?? null},
        refreshed_at = ${params.refreshedAt},
        country_prefix = ${params.countryPrefix ?? null},
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
        Effect.logError('Error in updateRefreshUser', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('updateRefreshUser query')
  )
})
