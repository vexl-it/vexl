import {SqlClient, SqlResolver} from '@effect/sql'
import {
  PublicKeyPemBase64E,
  type PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {CountryPrefixE} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {Context, Effect, flow, Layer, Schema} from 'effect'

const UserRecordId = Schema.String.pipe(Schema.brand('UserRecordId'))
export type UserRecordId = Schema.Schema.Type<typeof UserRecordId>

export class UserRecord extends Schema.TaggedClass<UserRecord>()('UserRecord', {
  id: UserRecordId,
  publicKey: PublicKeyPemBase64E,
  countryPrefix: Schema.optional(CountryPrefixE),
}) {}

export const UserInsert = Schema.Struct({
  publicKey: PublicKeyPemBase64E,
  countryPrefix: Schema.optional(CountryPrefixE),
})
export type UserInsert = Schema.Schema.Type<typeof UserInsert>

export interface LoggedInUsersDbOperations {
  insertUser: (input: UserInsert) => Effect.Effect<void, UnexpectedServerError>
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
          Request: PublicKeyPemBase64E,
          execute: (requests) => {
            return sql`
              DELETE FROM users
              WHERE
                ${sql.in('public_key', requests)}
            `
          },
        })
      )
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
