import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {VexlNotificationToken} from '@vexl-next/domain/src/general/notifications/VexlNotificationToken'
import {ExpoNotificationToken} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import {Effect, flow, Option, Schema} from 'effect'
import {SqlSchema} from 'effect/unstable/sql'
import {ServerHashedNumber} from '../../../utils/serverHashContact'
import {UserRecord} from '../domain'

export const CreateUserParams = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  hash: ServerHashedNumber,
  firebaseToken: Schema.OptionFromOptional(FcmToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  expoToken: Schema.OptionFromOptional(ExpoNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  vexlNotificationToken: Schema.OptionFromOptional(VexlNotificationToken).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  clientVersion: Schema.OptionFromOptional(VersionCode).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  platform: Schema.OptionFromOptional(PlatformName).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  appSource: Schema.OptionFromOptional(AppSource).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
  publicKeyV2: Schema.OptionFromOptional(PublicKeyV2).pipe(
    Schema.withConstructorDefault(Effect.succeed(Option.none()))
  ),
})
export type CreateUserParams = Schema.Schema.Type<typeof CreateUserParams>

export const createInsertUser = Effect.gen(function* () {
  const sql = yield* PgClient.PgClient

  const query = SqlSchema.findOne({
    Request: CreateUserParams,
    Result: UserRecord,
    execute: (params) => sql`
      INSERT INTO
        users ${sql.insert([
        {
          publicKey: params.publicKey,
          hash: params.hash,
          firebaseToken: params.firebaseToken ?? null,
          expoToken: params.expoToken ?? null,
          vexlNotificationToken: params.vexlNotificationToken ?? null,
          clientVersion: params.clientVersion ?? null,
          platform: params.platform ?? null,
          refreshedAt: new Date(),
          lastNewContentNotificationSentAt: null,
          appSource: params.appSource ?? null,
          publicKeyV2: params.publicKeyV2 ?? null,
        },
      ])}
      RETURNING
        users.*
    `,
  })

  return flow(
    query,
    UnexpectedServerError.wrapErrors('Error inserting user'),
    Effect.withSpan('createInsertUser query')
  )
})
