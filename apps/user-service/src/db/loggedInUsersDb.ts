import {SqlClient, SqlResolver, SqlSchema} from '@effect/sql'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {PublicKeyV2} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Context, Effect, flow, Layer, Schema} from 'effect'

const UserRecordId = Schema.String.pipe(Schema.brand('UserRecordId'))
export type UserRecordId = Schema.Schema.Type<typeof UserRecordId>

export class UserRecord extends Schema.TaggedClass<UserRecord>()('UserRecord', {
  id: UserRecordId,
  publicKey: PublicKeyPemBase64,
  publicKeyV2: Schema.optional(PublicKeyV2),
  countryPrefix: Schema.optional(CountryPrefix),
}) {}

export const UserInsert = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  countryPrefix: Schema.optional(CountryPrefix),
})
export type UserInsert = Schema.Schema.Type<typeof UserInsert>

const UpdatePublicKeyV2Input = Schema.Struct({
  publicKey: PublicKeyPemBase64,
  publicKeyV2: PublicKeyV2,
})
type UpdatePublicKeyV2Input = Schema.Schema.Type<typeof UpdatePublicKeyV2Input>

export interface LoggedInUsersDbOperations {
  insertUser: (input: UserInsert) => Effect.Effect<void, UnexpectedServerError>
  updatePublicKeyV2: (
    input: UpdatePublicKeyV2Input
  ) => Effect.Effect<void, UnexpectedServerError>
  deleteUser: (
    publicKey: PublicKeyPemBase64
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class LoggedInUsersDbService extends Context.Tag(
  'LoggedInUsersDbService'
)<LoggedInUsersDbService, LoggedInUsersDbOperations>() {
  static readonly Live = Layer.effect(
    LoggedInUsersDbService,
    Effect.gen(function* (_) {
      const sql = yield* _(SqlClient.SqlClient)

      const insertUserResolver = yield* _(
        SqlResolver.void('insertUser', {
          Request: UserInsert,
          execute: (requests) => {
            return sql`
              INSERT INTO
                users ${sql.insert(requests)}
            `
          },
        })
      )

      const deleteUserResolver = yield* _(
        SqlResolver.void('deleteUser', {
          Request: PublicKeyPemBase64,
          execute: (requests) => {
            return sql`
              DELETE FROM users
              WHERE
                ${sql.in('public_key', requests)}
            `
          },
        })
      )

      const updatePublicKeyV2Query = SqlSchema.void({
        Request: UpdatePublicKeyV2Input,
        execute: (request) => sql`
          UPDATE users
          SET
            public_key_v2 = ${request.publicKeyV2}
          WHERE
            public_key = ${request.publicKey}
        `,
      })

      return {
        insertUser: flow(
          insertUserResolver.execute,
          Effect.catchAll((e) =>
            Effect.zipRight(
              Effect.logError('Error while inserting user', e),
              Effect.fail(new UnexpectedServerError({status: 500}))
            )
          )
        ),
        updatePublicKeyV2: flow(
          updatePublicKeyV2Query,
          Effect.catchAll((e) =>
            Effect.zipRight(
              Effect.logError('Error updating user public key v2', e),
              Effect.fail(new UnexpectedServerError({status: 500}))
            )
          )
        ),
        deleteUser: flow(
          deleteUserResolver.execute,
          Effect.catchAll((e) =>
            Effect.zipRight(
              Effect.logError('Error deleting inserting user', e),
              Effect.fail(new UnexpectedServerError({status: 500}))
            )
          )
        ),
      }
    })
  )
}
