import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Context, Effect, Layer, type Option} from 'effect'
import {type UserRecord} from './domain'
import {createDeleteUserByPublicKeyAndHash} from './queries/createDeleteUserByPublicKeyAndHash'
import {createFindUserByHash} from './queries/createFindUserByHash'
import {createFindUserbyPublicKeyAndHash} from './queries/createFindUserByPublicKeyAndHash'
import {
  createInsertUser,
  type CreateUserParams,
} from './queries/createInsertUser'
import {
  createUpdateFirebaseToken,
  type UpdateFirebaseTokenParams,
} from './queries/createUpdateFirebaseToken'
import {
  createUpdateRefreshUser,
  type UpdateRefreshUserParams,
} from './queries/createUpdateRefreshUser'

export interface UserDbOperations {
  insertUser: (
    args: CreateUserParams
  ) => Effect.Effect<UserRecord, UnexpectedServerError>

  findUserByHash: (
    hash: HashedPhoneNumber
  ) => Effect.Effect<Option.Option<UserRecord>, UnexpectedServerError>

  findUserByPublicKeyAndHash: (args: {
    hash: HashedPhoneNumber
    publicKey: PublicKeyPemBase64
  }) => Effect.Effect<Option.Option<UserRecord>, UnexpectedServerError>

  deleteUserByPublicKeyAndHash: (args: {
    publicKey: PublicKeyPemBase64
    hash: HashedPhoneNumber
  }) => Effect.Effect<void, UnexpectedServerError>

  updateRefreshUser: (
    args: UpdateRefreshUserParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateFirebaseToken: (
    args: UpdateFirebaseTokenParams
  ) => Effect.Effect<void, UnexpectedServerError>
}

export class UserDbService extends Context.Tag('UserDbService')<
  UserDbService,
  UserDbOperations
>() {
  static readonly Live = Layer.effect(
    UserDbService,
    Effect.gen(function* (_) {
      const insertUser = yield* _(createInsertUser)
      const findUserByHash = yield* _(createFindUserByHash)
      const findUserByPublicKeyAndHash = yield* _(
        createFindUserbyPublicKeyAndHash
      )
      const deleteUserByPublicKeyAndHash = yield* _(
        createDeleteUserByPublicKeyAndHash
      )
      const updateRefreshUser = yield* _(createUpdateRefreshUser)
      const updateFirebaseToken = yield* _(createUpdateFirebaseToken)

      return {
        insertUser,
        findUserByHash,
        findUserByPublicKeyAndHash,
        deleteUserByPublicKeyAndHash,
        updateRefreshUser,
        updateFirebaseToken,
      }
    })
  )
}
