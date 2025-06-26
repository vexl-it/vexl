import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, flow, Schema} from 'effect'

export const UpdateRefreshUserParams = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  hash: HashedPhoneNumberE,
  clientVersion: Schema.optionalWith(VersionCode, {as: 'Option'}),
  countryPrefix: Schema.optionalWith(CountryPrefixE, {as: 'Option'}),
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
