import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ServerHashedNumber} from '../../../utils/serverHashContact'

export const UpdateRefreshUserParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  clientVersion: Schema.OptionFromOptional(VersionCode).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  countryPrefix: Schema.OptionFromOptional(CountryPrefix).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  appSource: Schema.OptionFromOptional(Schema.String).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  vexlNotificationToken: Schema.OptionFromOptional(VexlNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  refreshedAt: Schema.DateFromString,
  publicKeyV2: Schema.OptionFromOptional(PublicKeyV2).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type UpdateRefreshUserParams = typeof UpdateRefreshUserParams.Type

export const createUpdateRefreshUser = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.void({
    Request: UpdateRefreshUserParams,
    execute: (params) => sql`
      UPDATE users
      SET
        client_version = ${params.clientVersion ?? null},
        refreshed_at = ${params.refreshedAt},
        country_prefix = ${params.countryPrefix ?? null},
        app_source = ${params.appSource ?? null},
        vexl_notification_token = ${params.vexlNotificationToken ?? null},
        public_key_v2 = ${params.publicKeyV2 ?? null},
        last_inactivity_notification_sent_at = NULL,
        number_of_inactivity_notifications_sent = 0
      WHERE
        public_key = ${params.publicKey}
        AND hash = ${params.hash}
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error in updateRefreshUser'),
    Effect.withSpan('updateRefreshUser query')
  )
})
