import {type PublicKeyPemBase64} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {type UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import {type HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {type FcmToken} from '@vexl-next/domain/src/utility/FcmToken.brand'
import {Context, Effect, Layer, type Option} from 'effect'
import {type UserRecord} from './domain'
import {createDeleteUserByPublicKeyAndHash} from './queries/createDeleteUserByPublicKeyAndHash'
import {
  createFindTokensOfUsersWhoDirectlyImportedHash,
  type FindTokensOfUsersWhoDirectlyImportedHashParams,
} from './queries/createFindFirebaseTokenOfUsersWhoDirectlyImportedHash'
import {createFindFirebaseTokensForNewContentNotification} from './queries/createFindFirebaseTokensForNewContentNotification'
import {createFindFirebaseTokensOfInactiveUsers} from './queries/createFindFirebaseTokensOfInactiveUsers'
import {
  createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact,
  type FindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactParams,
} from './queries/createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact'
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
import {createUpdateInvalidateFirebaseToken} from './queries/createUpdateInvalidateFirebaseToken'
import {
  createUpdateRefreshUser,
  type UpdateRefreshUserParams,
} from './queries/createUpdateRefreshUser'
import {createUpdateSetRefreshedAtToNull} from './queries/createUpdateSetRefreshedAtToNull'
import {
  createUpdateUserHash,
  type UpdateUserHashParams,
} from './queries/createUpdateUserHash'
import {
  createUpdateUserInitialImportDone,
  type UpdateUserInitialImportDoneParams,
} from './queries/createUpdateUserInitialImportDone'

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

  findFirebaseTokensOfUsersWhoDirectlyImportedHash: (
    args: FindTokensOfUsersWhoDirectlyImportedHashParams
  ) => Effect.Effect<readonly FcmToken[], UnexpectedServerError>

  findFirebaseTokensOfUsersWhoHaveHAshAsSecondLevelContact: (
    args: FindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContactParams
  ) => Effect.Effect<readonly FcmToken[], UnexpectedServerError>

  findFirebaseTokensOfInactiveUsers: (
    beforeRefreshetAt: Date
  ) => Effect.Effect<readonly FcmToken[], UnexpectedServerError>

  findFirebaseTokensForNewContentNotification: (
    beforeRefreshetAt: Date
  ) => Effect.Effect<readonly FcmToken[], UnexpectedServerError>

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

  updateInvalidateFirebaseToken: (
    args: FcmToken
  ) => Effect.Effect<void, UnexpectedServerError>

  updateSetRefreshedAtToNull: (
    args: FcmToken
  ) => Effect.Effect<void, UnexpectedServerError>

  updateUserHash: (
    args: UpdateUserHashParams
  ) => Effect.Effect<void, UnexpectedServerError>

  updateUserInitialImportDone: (
    args: UpdateUserInitialImportDoneParams
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
      const updateInvalidateFirebaseToken = yield* _(
        createUpdateInvalidateFirebaseToken
      )

      const findFirebaseTokensOfUsersWhoDirectlyImportedHash = yield* _(
        createFindTokensOfUsersWhoDirectlyImportedHash
      )
      const findFirebaseTokensOfUsersWhoHaveHAshAsSecondLevelContact = yield* _(
        createFindFirebaseTokensOfUsersWhoHaveHashAsSecondLevelContact
      )

      const findFirebaseTokensOfInactiveUsers = yield* _(
        createFindFirebaseTokensOfInactiveUsers
      )

      const updateSetRefreshedAtToNull = yield* _(
        createUpdateSetRefreshedAtToNull
      )

      const findFirebaseTokensForNewContentNotification = yield* _(
        createFindFirebaseTokensForNewContentNotification
      )

      const updateUserHash = yield* _(createUpdateUserHash)

      const updateUserInitialImportDone = yield* _(
        createUpdateUserInitialImportDone
      )

      return {
        insertUser,
        findUserByHash,
        findUserByPublicKeyAndHash,
        deleteUserByPublicKeyAndHash,
        updateRefreshUser,
        updateFirebaseToken,
        updateInvalidateFirebaseToken,
        findFirebaseTokensOfUsersWhoDirectlyImportedHash,
        findFirebaseTokensOfUsersWhoHaveHAshAsSecondLevelContact,
        findFirebaseTokensOfInactiveUsers,
        updateSetRefreshedAtToNull,
        findFirebaseTokensForNewContentNotification,
        updateUserHash,
        updateUserInitialImportDone,
      }
    })
  )
}
