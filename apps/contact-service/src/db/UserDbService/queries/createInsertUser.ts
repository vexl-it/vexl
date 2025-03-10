import {SqlSchema} from '@effect/sql'
import {PgClient} from '@effect/sql-pg'
import {PublicKeyPemBase64E} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {ExpoNotificationTokenE} from '@vexl-next/domain/src/utility/ExpoNotificationToken.brand'
import {FcmTokenE} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {PlatformName} from '@vexl-next/rest-api/src/PlatformName'
import {Effect, flow, Schema} from 'effect'
import {UserRecord} from '../domain'

export const CreateUserParams = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  hash: HashedPhoneNumberE,
  firebaseToken: Schema.optionalWith(FcmTokenE, {as: 'Option'}),
  expoToken: Schema.optionalWith(ExpoNotificationTokenE, {as: 'Option'}),
  clientVersion: Schema.optionalWith(VersionCode, {as: 'Option'}),
  platform: Schema.optionalWith(PlatformName, {as: 'Option'}),
})
export type CreateUserParams = Schema.Schema.Type<typeof CreateUserParams>

export const createInsertUser = Effect.gen(function* (_) {
  const sql = yield* _(PgClient.PgClient)

  const query = SqlSchema.single({
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
          clientVersion: params.clientVersion ?? null,
          platform: params.platform ?? null,
          refreshedAt: new Date(),
          lastNewContentNotificationSentAt: null,
        },
      ])}
      RETURNING
        users.*
    `,
  })

  return flow(
    query,
    Effect.catchAll((e) =>
      Effect.zipRight(
        Effect.logError('Error inserting user', e),
        Effect.fail(new UnexpectedServerError({status: 500}))
      )
    ),
    Effect.withSpan('createInsertUser query')
  )
})
